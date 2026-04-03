import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'SMARTCARL – Schadensmeldungen für Hausverwaltungen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const imageBuffer = readFileSync(join(process.cwd(), 'public', 'wien_blutgasse_a.jpg'))
  const base64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        {/* Hintergrundfoto */}
        <img src={base64} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

        {/* Dunkles Overlay — genau wie auf der Seite */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,7,0.74)', display: 'flex' }} />

        {/* Roter Strich oben */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: '#C74229', display: 'flex' }} />

        {/* Inhalt */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 80px' }}>

          {/* SMARTCARL Logo */}
          <div style={{ display: 'flex', marginBottom: 36 }}>
            <span style={{ color: '#C74229', fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', display: 'flex' }}>SMARTCARL</span>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ color: '#FFFFFF', fontSize: 62, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Schadensmeldungen,</span>
            <span style={{ color: '#FFFFFF', fontSize: 62, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>die sich mit nur einem</span>
            <span style={{ color: '#FFFFFF', fontSize: 62, fontWeight: 700, lineHeight: 1.1, display: 'flex' }}>Klick von selbst erledigen.</span>
          </div>

          {/* Domain */}
          <div style={{ display: 'flex', marginTop: 32 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, display: 'flex' }}>smartcarl.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
