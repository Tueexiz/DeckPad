/**
 * Lazy Resend client — falls back to console.log when RESEND_API_KEY is absent.
 * Keeps zero hard dependency on Resend at runtime when not configured.
 */
import { Resend } from 'resend';

type WaitlistPayload = {
  email: string;
  usecase: string;
  consent: boolean;
  meta?: { ip?: string; ua?: string };
};

const apiKey = process.env.RESEND_API_KEY;
const audienceId = process.env.RESEND_AUDIENCE_ID;
const support = process.env.SUPPORT_EMAIL ?? 'support@deckpad.app';
const noreply = process.env.NOREPLY_EMAIL ?? 'DeckPad <noreply@deckpad.app>';

let _client: Resend | null = null;
function client() {
  if (!apiKey) return null;
  if (_client) return _client;
  _client = new Resend(apiKey);
  return _client;
}

export async function sendWaitlistEmail(payload: WaitlistPayload) {
  const c = client();
  if (!c) {
    // eslint-disable-next-line no-console
    console.log('[waitlist:dev]', JSON.stringify(payload, null, 2));
    return { ok: true, mode: 'console' as const };
  }

  const usecaseLabel: Record<string, string> = {
    gaming: 'Gaming',
    streaming: 'Streaming',
    productivity: 'Productivité',
    other: 'Autre',
  };

  try {
    await c.emails.send({
      from: noreply,
      to: support,
      subject: `Nouvelle inscription — ${payload.email}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#0c0a09;line-height:1.6">
          <h2 style="margin:0 0 12px;font-size:18px">Nouvelle inscription DeckPad</h2>
          <p><strong>Email :</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Usage :</strong> ${escapeHtml(usecaseLabel[payload.usecase] ?? payload.usecase)}</p>
          <p><strong>Consentement RGPD :</strong> ${payload.consent ? 'Oui' : 'Non'}</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0" />
          <p style="font-size:12px;color:#737373">IP ${escapeHtml(payload.meta?.ip ?? '—')} · UA ${escapeHtml(payload.meta?.ua ?? '—')}</p>
        </div>
      `,
    });

    if (audienceId) {
      try {
        await c.contacts.create({
          email: payload.email,
          audienceId,
          unsubscribed: false,
        });
      } catch {
        // duplicate or audience error — non-fatal
      }
    }

    return { ok: true, mode: 'resend' as const };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[waitlist:resend-error]', err);
    return { ok: false, mode: 'resend' as const, error: 'send_failed' };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
