import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function formatConfidence(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

function buildEmailHtml(args: {
  fullName: string;
  familyName: string;
  kingdomName: string;
  clanName: string;
  language: string;
  regions: string;
  compositeConfidence: number;
  certificateId: string;
  narrativePreview: string;
  appBaseUrl: string;
}): string {
  const score = formatConfidence(args.compositeConfidence);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Africa Ancestry Report</title>
</head>
<body style="margin:0;padding:0;background:#f7f4ec;font-family:'Georgia',serif;color:#1c1c1c;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ec;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #d8c994;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#1c1c1c;padding:24px 32px;">
            <p style="margin:0;color:#c9a84c;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Africa Ancestry</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:normal;">Your Ancestry Report</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
              Dear <strong>${args.fullName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
              Your full ancestry report is attached as a PDF. Here's a summary of your ancestral profile:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #dfd3aa;border-radius:4px;overflow:hidden;">
              <tr style="background:#faf7ed;">
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;border-bottom:1px solid #dfd3aa;">Ethno-Linguistic Family</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #dfd3aa;">${args.familyName}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;border-bottom:1px solid #dfd3aa;">Kingdom / Nation</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #dfd3aa;">${args.kingdomName}</td>
              </tr>
              <tr style="background:#faf7ed;">
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;border-bottom:1px solid #dfd3aa;">Clan / Lineage</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #dfd3aa;">${args.clanName}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;border-bottom:1px solid #dfd3aa;">Language</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #dfd3aa;">${args.language}</td>
              </tr>
              <tr style="background:#faf7ed;">
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;border-bottom:1px solid #dfd3aa;">Primary Regions</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #dfd3aa;">${args.regions}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b6b;">Confidence Score</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#7d641f;">${score}</td>
              </tr>
            </table>

            <div style="background:#faf7ed;border-left:3px solid #c9a84c;padding:16px 20px;margin:0 0 24px;border-radius:0 4px 4px 0;">
              <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">${args.narrativePreview}</p>
            </div>

            <p style="margin:0 0 8px;font-size:12px;color:#888;">Certificate ID: <code style="font-family:monospace;background:#f0f0f0;padding:2px 6px;border-radius:3px;">${args.certificateId}</code></p>
            <p style="margin:0 0 24px;font-size:12px;color:#888;">Your full PDF certificate is attached to this email.</p>

            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
              Africa Ancestry · This report is probabilistic, not a definitive genealogical proof.
              Confidence reflects current source coverage and match quality.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface ReportEmailArgs {
  to: string;
  fullName: string;
  familyName: string;
  kingdomName: string;
  clanName: string;
  language: string;
  regions: string;
  compositeConfidence: number;
  narrativePreview: string;
  certificateId: string;
  pdfBuffer: Buffer;
  appBaseUrl: string;
}

export async function sendReportEmail(args: ReportEmailArgs): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[email] RESEND_API_KEY not configured — skipping email delivery.');
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Africa Ancestry <reports@africaancestry.com>';
  const html = buildEmailHtml(args);

  const { error } = await client.emails.send({
    from,
    to: args.to,
    subject: `Your Ancestry Report — ${args.fullName}`,
    html,
    attachments: [
      {
        filename: `ancestry-report-${args.certificateId}.pdf`,
        content: args.pdfBuffer.toString('base64')
      }
    ]
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }

  console.log(`[email] Sent ancestry report to ${args.to} (cert: ${args.certificateId})`);
}
