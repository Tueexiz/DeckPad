import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DeckPad — Ton PC. Ta tablette. Un geste.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'radial-gradient(ellipse at top, #312E81 0%, #14102C 45%, #07060E 100%)',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Top hairline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            width: '60%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(245,244,240,0.4), transparent)',
          }}
        />
        {/* Indigo glow */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: 999,
            background:
              'radial-gradient(circle, rgba(99,102,241,0.55), rgba(99,102,241,0) 70%)',
          }}
        />

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1E1B4B, #0E0B1F)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#F5F4F0',
              fontSize: 26,
              fontWeight: 600,
              fontFamily: 'serif',
              letterSpacing: '-0.04em',
            }}
          >
            DP
          </div>
          <span
            style={{
              fontSize: 28,
              color: '#F5F4F0',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              fontFamily: 'serif',
            }}
          >
            DeckPad
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: 28,
          }}
        >
          <p
            style={{
              fontSize: 14,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#A8A296',
              margin: 0,
            }}
          >
            Édition 2026 — Fait à Paris
          </p>
          <h1
            style={{
              fontSize: 112,
              lineHeight: 0.95,
              letterSpacing: '-0.045em',
              color: '#F5F4F0',
              fontFamily: 'serif',
              fontWeight: 600,
              margin: 0,
              maxWidth: 1000,
            }}
          >
            Ton PC. Ta tablette. Un geste.
          </h1>
          <p
            style={{
              fontSize: 26,
              color: '#D9D6CC',
              maxWidth: 880,
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Télécommande de précision pour Windows. Latence sous 30 ms. Gratuit, sans
            compte, 100 % local.
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
