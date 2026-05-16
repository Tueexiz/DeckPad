import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendWaitlistEmail } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  email: z.string().trim().email(),
  usecase: z.enum(['gaming', 'streaming', 'productivity', 'other']),
  consent: z.literal(true),
});

/* ----------- Simple in-memory token bucket per IP (best-effort) ----------- */
const WINDOW_MS = 60_000;
const MAX_REQ = 10;
const buckets = new Map<string, { count: number; ts: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.ts > WINDOW_MS) {
    buckets.set(ip, { count: 1, ts: now });
    return true;
  }
  if (b.count >= MAX_REQ) return false;
  b.count += 1;
  return true;
}

function getIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': '60' } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_payload', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const ua = req.headers.get('user-agent') ?? undefined;
  const result = await sendWaitlistEmail({
    email: parsed.data.email,
    usecase: parsed.data.usecase,
    consent: parsed.data.consent,
    meta: { ip, ua },
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, mode: result.mode });
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
}
