import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const imgPath = path.join(process.cwd(), 'public', 'wien_blutgasse_a.jpg')
  const buf = fs.readFileSync(imgPath)
  const base64 = `data:image/jpeg;base64,${buf.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#000' }}>
        {/* Foto mit sehr niedriger Deckkraft */}
        <img src={base64} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        {/* Roter Strich oben */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: '#C74229', display: 'flex' }} />
        {/* Text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px' }}>
          <div style={{ display: 'flex', marginBottom: 28 }}>
            <span style={{ color: '#C74229', fontSize: 36, fontWeight: 700, letterSpacing: '0.1em', display: 'flex' }}>SMARTCARL</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#FFFFFF', fontSize: 52, fontWeight: 700, lineHeight: 1.15, display: 'flex' }}>Schadensmeldungen, die sich</span>
            <span style={{ color: '#FFFFFF', fontSize: 52, fontWeight: 700, lineHeight: 1.15, display: 'flex' }}>mit nur einem Klick von</span>
            <span style={{ color: '#FFFFFF', fontSize: 52, fontWeight: 700, lineHeight: 1.15, display: 'flex' }}>selbst erledigen.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 28 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, display: 'flex' }}>smartcarl.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
