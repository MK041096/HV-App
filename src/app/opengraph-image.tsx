import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SMARTCARL – Schadensmeldungen für Hausverwaltungen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        {/* Hero background image */}
        <img
          src="https://smartcarl.com/wien_blutgasse_a.jpg"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)', display: 'flex' }} />

        {/* Red accent bar top */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: '#C74229', display: 'flex' }} />

        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '72px 96px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, background: '#C74229', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex' }}>C</span>
            </div>
            <span style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 700, letterSpacing: '0.05em', display: 'flex' }}>SMARTCARL</span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 24 }}>
            <span style={{ color: '#FFFFFF', fontSize: 54, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Schadensmeldungen,</span>
            <span style={{ color: '#FFFFFF', fontSize: 54, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>die sich <span style={{ color: '#C74229', marginLeft: 16 }}>von selbst</span></span>
            <span style={{ color: '#FFFFFF', fontSize: 54, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>erledigen.</span>
          </div>

          {/* Subline */}
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 22, lineHeight: 1.5, display: 'flex' }}>
            smartcarl.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
