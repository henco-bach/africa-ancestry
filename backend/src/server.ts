import cors from 'cors';
import express from 'express';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createAncestryProfileHandler, generateAncestryProfile } from './ancestryProfileHandler.js';
import {
  AuthenticatedRequest,
  createAuthLoginHandler,
  createAuthMeHandler,
  createAuthRegisterHandler,
  createYocoCheckoutHandler,
  createYocoWebhookHandler,
  requireAuth,
  requireEntitlement
} from './billing.js';
import { createPhotoUploadInitHandler } from './upload.js';
import { generatePdf } from './pdf.js';
import { sendReportEmail } from './email.js';

const port = Number(process.env.PORT || 3000);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook must receive raw body for signature verification.
app.post('/api/payments/yoco/webhook', express.raw({ type: 'application/json' }), createYocoWebhookHandler(supabase));

app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  try {
    const { error } = await supabase.from('report_entitlements').select('id').limit(1);
    res.status(error ? 503 : 200).json({ ok: !error, db: error ? 'down' : 'up' });
  } catch {
    res.status(503).json({ ok: false, db: 'down' });
  }
});

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', createAuthRegisterHandler(supabase));
app.post('/api/auth/login', createAuthLoginHandler(supabase));
app.get('/api/auth/me', requireAuth(supabase), createAuthMeHandler());

// ── Upload routes ─────────────────────────────────────────────────────────────
app.post('/api/uploads/photo/init', requireAuth(supabase), createPhotoUploadInitHandler(supabase));

// ── Payment routes ────────────────────────────────────────────────────────────
app.post('/api/payments/yoco/checkout', requireAuth(supabase), createYocoCheckoutHandler(supabase));

// ── Entitlement check (polling after payment redirect) ────────────────────────
app.get('/api/ancestry/entitlement', requireAuth(supabase), async (req: AuthenticatedRequest, res) => {
  const entitlementKey = process.env.FULL_REPORT_ENTITLEMENT_KEY || 'ancestry_full_report';
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('report_entitlements')
    .select('id')
    .eq('user_id', req.auth!.userId)
    .eq('entitlement_key', entitlementKey)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  res.status(200).json({ ok: true, entitled: Boolean(data) });
});

// ── Preview: public, no auth needed ──────────────────────────────────────────
app.post('/api/ancestry/profile/preview', async (req, res) => {
  try {
    const full = await generateAncestryProfile(supabase, req.body);

    res.status(200).json({
      ancestryProfile: {
        person: full.ancestryProfile.person,
        input: full.ancestryProfile.input,
        hierarchy: full.ancestryProfile.hierarchy
      },
      confidenceBreakdown: full.confidenceBreakdown,
      narrativeSections: full.narrativeSections.slice(0, 2),
      generatedImage: {
        imagePrompt: null,
        mode: 'locked',
        explanation: 'Purchase full report access to unlock the complete narrative, source references, and image prompt.'
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ ok: false, error: message });
  }
});

// ── Full report: auth + paid entitlement required ─────────────────────────────
app.post(
  '/api/ancestry/profile',
  requireAuth(supabase),
  requireEntitlement(supabase, process.env.FULL_REPORT_ENTITLEMENT_KEY || 'ancestry_full_report'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await generateAncestryProfile(supabase, req.body);
      res.status(200).json(profile);

      // Fire-and-forget: generate PDF and email it
      if (req.auth?.email) {
        const email = req.auth.email;
        const birthPlace = String(req.body?.birthPlace || '');
        const appBaseUrl = process.env.APP_BASE_URL || 'https://africaancestry.com';
        const certificateId = randomUUID();

        void (async () => {
          try {
            const { buffer } = await generatePdf({
              certificateId,
              fullName: profile.ancestryProfile.person.fullName,
              dateOfBirth: profile.ancestryProfile.person.dateOfBirth,
              birthPlace,
              language: profile.ancestryProfile.input.language,
              familyName: profile.ancestryProfile.hierarchy.family?.name ?? 'Unknown',
              kingdomName: profile.ancestryProfile.hierarchy.kingdomNation?.name ?? 'Unknown',
              clanName: profile.ancestryProfile.hierarchy.clanLineage?.name ?? 'Untraced',
              compositeConfidence: profile.confidenceBreakdown.composite,
              regions: profile.ancestryProfile.regions,
              sources: profile.ancestryProfile.sources,
              narrativeSections: profile.narrativeSections,
              appBaseUrl
            });

            const regionsList = profile.ancestryProfile.regions
              .slice(0, 3)
              .map((r) => (r as { display_name?: string | null; name: string }).display_name || (r as { name: string }).name)
              .join(', ') || 'Not specified';

            const narrativePreview =
              profile.narrativeSections.find((s) => s.id === 'summary')?.body ||
              profile.narrativeSections[0]?.body ||
              '';

            await sendReportEmail({
              to: email,
              fullName: profile.ancestryProfile.person.fullName,
              familyName: profile.ancestryProfile.hierarchy.family?.name ?? 'Unknown',
              kingdomName: profile.ancestryProfile.hierarchy.kingdomNation?.name ?? 'Unknown',
              clanName: profile.ancestryProfile.hierarchy.clanLineage?.name ?? 'Untraced',
              language: profile.ancestryProfile.input.language,
              regions: regionsList,
              compositeConfidence: profile.confidenceBreakdown.composite,
              narrativePreview,
              certificateId,
              pdfBuffer: buffer,
              appBaseUrl
            });
          } catch (err) {
            console.error('[report] PDF/email delivery failed:', err);
          }
        })();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ ok: false, error: message });
    }
  }
);

// ── PDF download: auth + paid entitlement required ────────────────────────────
app.post(
  '/api/ancestry/pdf',
  requireAuth(supabase),
  requireEntitlement(supabase, process.env.FULL_REPORT_ENTITLEMENT_KEY || 'ancestry_full_report'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await generateAncestryProfile(supabase, req.body);
      const appBaseUrl = process.env.APP_BASE_URL || 'https://africaancestry.com';
      const birthPlace = String(req.body?.birthPlace || '');

      const { buffer, certificateId } = await generatePdf({
        fullName: profile.ancestryProfile.person.fullName,
        dateOfBirth: profile.ancestryProfile.person.dateOfBirth,
        birthPlace,
        language: profile.ancestryProfile.input.language,
        familyName: profile.ancestryProfile.hierarchy.family?.name ?? 'Unknown',
        kingdomName: profile.ancestryProfile.hierarchy.kingdomNation?.name ?? 'Unknown',
        clanName: profile.ancestryProfile.hierarchy.clanLineage?.name ?? 'Untraced',
        compositeConfidence: profile.confidenceBreakdown.composite,
        regions: profile.ancestryProfile.regions,
        sources: profile.ancestryProfile.sources,
        narrativeSections: profile.narrativeSections,
        appBaseUrl
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ancestry-report-${certificateId}.pdf"`);
      res.send(buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ ok: false, error: message });
    }
  }
);

app.listen(port, () => {
  console.log(`Africa Ancestry API listening on http://localhost:${port}`);
});
