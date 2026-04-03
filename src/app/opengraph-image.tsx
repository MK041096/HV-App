import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'SMARTCARL – Schadensmeldungen für Hausverwaltungen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const res = await fetch('https://www.smartcarl.com/wien_blutgasse_a.jpg')
  const buf = await res.arrayBuffer()
  const base64 = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        <img src={base64} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,7,0.74)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: '#C74229', display: 'flex' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 80px' }}>
          <div style={{ display: 'flex', marginBottom: 32 }}>
            <span style={{ color: '#C74229', fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', display: 'flex' }}>SMARTCARL</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#FFFFFF', fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Schadensmeldungen,</span>
            <span style={{ color: '#FFFFFF', fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>die sich mit nur einem</span>
            <span style={{ color: '#FFFFFF', fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Klick von selbst erledigen.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 28 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18, display: 'flex' }}>smartcarl.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
