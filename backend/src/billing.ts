import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
  };
}

const DEFAULT_ENTITLEMENT_KEY = process.env.FULL_REPORT_ENTITLEMENT_KEY || 'ancestry_full_report';
const DEFAULT_REPORT_AMOUNT_CENTS = Number(process.env.FULL_REPORT_AMOUNT_CENTS || 29900);
const DEFAULT_CURRENCY = process.env.PAYMENT_CURRENCY || 'ZAR';

function parseBearer(req: Request): string | null {
  const raw = req.header('authorization') || '';
  if (!raw.startsWith('Bearer ')) return null;
  return raw.slice('Bearer '.length).trim();
}

function verifyYocoWebhookSignature(rawBody: Buffer, req: Request): boolean {
  const webhookId = req.header('webhook-id') || '';
  const webhookTimestamp = req.header('webhook-timestamp') || '';
  const webhookSignature = req.header('webhook-signature') || '';
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET || '';

  if (!webhookId || !webhookTimestamp || !webhookSignature || !webhookSecret.startsWith('whsec_')) {
    return false;
  }

  const issuedAt = Number(webhookTimestamp);
  const now = Math.floor(Date.now() / 1000);
  const toleranceSec = Number(process.env.YOCO_WEBHOOK_TOLERANCE_SECONDS || 180);
  if (!Number.isFinite(issuedAt) || Math.abs(now - issuedAt) > toleranceSec) return false;

  const secretKey = Buffer.from(webhookSecret.slice('whsec_'.length), 'base64');
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody.toString('utf8')}`;
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(signedContent).digest('base64');

  return webhookSignature
    .split(' ')
    .map((chunk) => {
      const [version, sig] = chunk.split(',');
      return version === 'v1' && sig ? sig : null;
    })
    .filter((sig): sig is string => Boolean(sig))
    .some((sig) => {
      const a = Buffer.from(sig);
      const b = Buffer.from(expectedSignature);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function requireAuth(supabase: SupabaseClient) {
  return async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const token = parseBearer(req);
    if (!token) {
      res.status(401).json({ ok: false, error: 'Missing Bearer token.' });
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ ok: false, error: 'Invalid or expired token.' });
      return;
    }

    req.auth = { userId: data.user.id, email: data.user.email ?? '' };
    next();
  };
}

export function requireEntitlement(supabase: SupabaseClient, entitlementKey = DEFAULT_ENTITLEMENT_KEY) {
  return async function entitlementMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.auth?.userId) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }

    const now = new Date().toISOString();
    const { data } = await supabase
      .from('report_entitlements')
      .select('id')
      .eq('user_id', req.auth.userId)
      .eq('entitlement_key', entitlementKey)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    if (!data) {
      res.status(402).json({
        ok: false,
        error: 'Paid report access required.',
        entitlementKey,
        paymentRequired: true
      });
      return;
    }

    next();
  };
}

// ── Auth handlers ─────────────────────────────────────────────────────────────

export function createAuthRegisterHandler(supabase: SupabaseClient) {
  return async function registerHandler(req: Request, res: Response) {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = req.body?.fullName ? String(req.body.fullName).trim() : undefined;

    if (!email || !email.includes('@')) {
      res.status(400).json({ ok: false, error: 'Valid email is required.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
      return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? null }
    });

    if (error) {
      const status = error.message.toLowerCase().includes('already') ? 409 : 500;
      res.status(status).json({ ok: false, error: error.message });
      return;
    }

    // Sign in immediately to return a token
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !session.session) {
      res.status(500).json({ ok: false, error: 'Account created but sign-in failed.' });
      return;
    }

    res.status(201).json({
      ok: true,
      token: session.session.access_token,
      user: { id: data.user.id, email: data.user.email, fullName: fullName ?? null }
    });
  };
}

export function createAuthLoginHandler(supabase: SupabaseClient) {
  return async function loginHandler(req: Request, res: Response) {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      res.status(400).json({ ok: false, error: 'Email and password are required.' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      res.status(401).json({ ok: false, error: 'Invalid credentials.' });
      return;
    }

    res.status(200).json({
      ok: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name ?? null
      }
    });
  };
}

export function createAuthMeHandler() {
  return async function meHandler(req: AuthenticatedRequest, res: Response) {
    res.status(200).json({ ok: true, user: req.auth });
  };
}

// ── Payment handlers ──────────────────────────────────────────────────────────

export function createYocoCheckoutHandler(supabase: SupabaseClient) {
  return async function checkoutHandler(req: AuthenticatedRequest, res: Response) {
    if (!req.auth?.userId) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }

    const yocoSecretKey = process.env.YOCO_SECRET_KEY;
    if (!yocoSecretKey) {
      res.status(500).json({ ok: false, error: 'YOCO_SECRET_KEY is not configured.' });
      return;
    }

    const entitlementKey = String(req.body?.entitlementKey || DEFAULT_ENTITLEMENT_KEY);
    const amount = Number(req.body?.amountCents || DEFAULT_REPORT_AMOUNT_CENTS);
    const currency = String(req.body?.currency || DEFAULT_CURRENCY).toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ ok: false, error: 'Invalid amount.' });
      return;
    }

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:4173';
    const successUrl = String(req.body?.successUrl || `${appBaseUrl}/checkout/success`);
    const cancelUrl = String(req.body?.cancelUrl || `${appBaseUrl}/checkout/cancel`);

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
        Authorization: `Bearer ${yocoSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        successUrl,
        cancelUrl,
        metadata: { userId: req.auth.userId, entitlementKey }
      })
    });

    const payload = await yocoResponse.json() as any;

    if (!yocoResponse.ok) {
      res.status(502).json({ ok: false, error: 'Failed to create Yoco checkout.', details: payload });
      return;
    }

    const checkoutId = String(payload.id || payload.checkoutId || '');
    const redirectUrl = String(payload.redirectUrl || payload.redirect_url || '');

    if (!checkoutId || !redirectUrl) {
      res.status(502).json({ ok: false, error: 'Invalid Yoco checkout response.' });
      return;
    }

    await supabase.from('yoco_checkout_sessions').upsert({
      user_id: req.auth.userId,
      entitlement_key: entitlementKey,
      amount_cents: amount,
      currency,
      checkout_id: checkoutId,
      status: String(payload.status || 'pending'),
      redirect_url: redirectUrl,
      raw_response: payload
    }, { onConflict: 'checkout_id' });

    res.status(200).json({ ok: true, checkoutId, redirectUrl, entitlementKey, amount, currency });
  };
}

export function createYocoWebhookHandler(supabase: SupabaseClient) {
  return async function webhookHandler(req: Request, res: Response) {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

    if (!verifyYocoWebhookSignature(rawBody, req)) {
      res.status(401).json({ ok: false, error: 'Invalid webhook signature.' });
      return;
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON payload.' });
      return;
    }

    const type = String(event?.type || event?.eventType || '').toLowerCase();
    const payloadObj = event?.payload || event?.data?.object || event?.data || {};
    const checkoutId = String(payloadObj?.metadata?.checkoutId || payloadObj?.checkoutId || event?.checkoutId || '');
    const paymentId = payloadObj?.paymentId
      ? String(payloadObj.paymentId)
      : type.includes('payment.') && payloadObj?.id ? String(payloadObj.id) : null;
    const status = String(payloadObj?.status || event?.status || 'unknown').toLowerCase();
    const metadata = payloadObj?.metadata || event?.metadata || {};

    const successfulEvent =
      status === 'paid' || status === 'successful' || status === 'completed' ||
      type.includes('checkout.completed') || type.includes('payment.succeeded');

    try {
      if (checkoutId) {
        const metadataUserId = metadata?.userId ? String(metadata.userId) : null;

        if (metadataUserId) {
          await supabase.from('yoco_checkout_sessions').upsert({
            user_id: metadataUserId,
            entitlement_key: metadata?.entitlementKey ? String(metadata.entitlementKey) : DEFAULT_ENTITLEMENT_KEY,
            amount_cents: payloadObj?.amount ? Number(payloadObj.amount) : 1,
            currency: payloadObj?.currency ? String(payloadObj.currency).toUpperCase() : 'ZAR',
            checkout_id: checkoutId,
            payment_id: paymentId,
            status,
            raw_response: event,
            ...(successfulEvent ? { completed_at: new Date().toISOString() } : {})
          }, { onConflict: 'checkout_id' });
        } else {
          await supabase
            .from('yoco_checkout_sessions')
            .update({
              payment_id: paymentId,
              status,
              raw_response: event,
              ...(successfulEvent ? { completed_at: new Date().toISOString() } : {})
            })
            .eq('checkout_id', checkoutId);
        }
      }

      let userId: string | null = metadata?.userId ? String(metadata.userId) : null;
      let entitlementKey = metadata?.entitlementKey ? String(metadata.entitlementKey) : DEFAULT_ENTITLEMENT_KEY;

      if (!userId && checkoutId) {
        const { data: session } = await supabase
          .from('yoco_checkout_sessions')
          .select('user_id, entitlement_key')
          .eq('checkout_id', checkoutId)
          .maybeSingle();

        if (session) {
          userId = session.user_id;
          entitlementKey = session.entitlement_key;
        }
      }

      if (successfulEvent && userId) {
        await supabase.from('report_entitlements').upsert({
          user_id: userId,
          entitlement_key: entitlementKey,
          status: 'active',
          source: 'yoco',
          external_payment_id: paymentId,
          metadata: { checkoutId, webhookType: type },
          granted_at: new Date().toISOString()
        }, { onConflict: 'user_id,entitlement_key' });
      }

      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ ok: false, error: 'Webhook processing failed.' });
    }
  };
}
