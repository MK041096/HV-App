import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SMARTCARL – Schadensmeldungen für Hausverwaltungen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: '#0F0F0F',
          padding: '80px 100px',
          position: 'relative',
        }}
      >
        {/* Red accent bar top */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: '#C74229', display: 'flex' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: '#C74229',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, display: 'flex' }}>C</div>
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', display: 'flex' }}>
            SMARTCARL
          </span>
        </div>

        {/* Headline */}
        <div style={{ color: '#FFFFFF', fontSize: 58, fontWeight: 700, lineHeight: 1.1, marginBottom: 28, display: 'flex', flexDirection: 'column' }}>
          <span>Schadensmeldungen</span>
          <span style={{ color: '#C74229' }}>automatisch.</span>
        </div>

        {/* Subline */}
        <div style={{ color: '#999999', fontSize: 24, lineHeight: 1.5, maxWidth: 700, display: 'flex' }}>
          Von der Meldung bis zur fertigen Dokumentation — in Sekunden, nicht Stunden.
        </div>

        {/* Domain bottom right */}
        <div style={{ position: 'absolute', bottom: 48, right: 100, color: '#555555', fontSize: 18, display: 'flex' }}>
          smartcarl.com
        </div>
      </div>
    ),
    { ...size }
  )
}
