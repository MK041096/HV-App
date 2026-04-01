'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OnboardingModal from './OnboardingModal'

/* ─────────────────────────────────────────────
   Dashboard Mockup – dunkles HV-Portal Design
   (bleibt dunkel – zeigt die App)
   ───────────────────────────────────────────── */
function DashboardMockup() {
  const cases = [
    { status: 'NEU',            sc: '#4ade80', sb: 'rgba(74,222,128,0.12)',  se: 'rgba(74,222,128,0.22)',  title: 'Wasserschaden – Badezimmer', addr: 'Musterstraße 12, Top 4',  time: 'Heute, 09:14'   },
    { status: 'IN BEARBEITUNG', sc: '#fbbf24', sb: 'rgba(251,191,36,0.12)', se: 'rgba(251,191,36,0.22)', title: 'Riss in Außenwand',          addr: 'Beispielgasse 7, Top 8', time: 'Gestern, 14:32' },
    { status: 'TERMIN',         sc: '#60a5fa', sb: 'rgba(96,165,250,0.12)', se: 'rgba(96,165,250,0.22)', title: 'Defekte Heizung',            addr: 'Testweg 3, Top 2',       time: 'Mo, 11:05'      },
    { status: 'ERLEDIGT',       sc: '#6b7280', sb: 'rgba(107,114,128,0.1)', se: 'rgba(107,114,128,0.2)', title: 'Türschloss defekt',          addr: 'Hauptgasse 5, Top 1',    time: 'Fr, 09:30'      },
  ]

  const stats = [
    { label: 'Offen',         value: '4',  color: '#C74229' },
    { label: 'In Bearbeitung',value: '2',  color: '#fbbf24' },
    { label: 'Erledigt',      value: '12', color: '#4ade80' },
  ]

  return (
    <div style={{
      background: '#0D0D0D',
      border: '1px solid #222',
      borderRadius: 14,
      boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: 480,
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#2e2e2e','#353535','#3e3e3e'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, marginLeft: 6, background: '#181818', borderRadius: 4, height: 20, maxWidth: 210, border: '1px solid #252525', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ color: '#3a3a3a', fontSize: 9, fontFamily: 'monospace' }}>app.smartcarl.at/dashboard</span>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ background: 'rgba(199,66,41,0.15)', border: '1px solid rgba(199,66,41,0.25)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-10.5z" stroke="#C74229" strokeWidth="2" fill="none"/><path d="M9 22v-7h6v7" stroke="#C74229" strokeWidth="2"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 600, color: '#F5F0E8', letterSpacing: '0.05em' }}>SMARTCARL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 10, color: '#444', background: '#161616', border: '1px solid #222', padding: '2px 8px', borderRadius: 4 }}>HV-Dashboard</span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(199,66,41,0.2)', border: '1px solid rgba(199,66,41,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#C74229', fontWeight: 600, fontFamily: 'var(--font-dm-sans, sans-serif)' }}>MK</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #1a1a1a' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 9, color: '#444', marginTop: 3, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Case list */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {cases.map((c, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 7, padding: '9px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <span style={{ background: c.sb, color: c.sc, border: `1px solid ${c.se}`, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 5px', borderRadius: 3, whiteSpace: 'nowrap', marginTop: 2, fontFamily: 'var(--font-dm-sans, sans-serif)', flexShrink: 0 }}>{c.status}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11.5, fontWeight: 500, color: '#EDE8E0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 10, color: '#444' }}>{c.addr} · {c.time}</div>
              </div>
            </div>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2e2e2e" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 2 }}>
        {['Übersicht','Fälle','Mieter','Objekte','Werkstätten'].map((t, i) => (
          <span key={t} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 9.5, fontWeight: i===0?600:400, color: i===0?'#C74229':'#3a3a3a', padding: '3px 7px', borderRadius: 4, background: i===0?'rgba(199,66,41,0.12)':'transparent', border: i===0?'1px solid rgba(199,66,41,0.2)':'1px solid transparent' }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Navbar – Zara-Style Light
   ───────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { label: 'Funktionen', href: '#funktionen' },
    { label: 'Ablauf',     href: '#ablauf'     },
    { label: 'Preise',     href: '#preise'     },
  ]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? '#E0E0E0' : 'transparent'}`,
      transition: 'background 0.35s, border-color 0.35s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Wordmark */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 22, fontWeight: 700, color: '#C74229', letterSpacing: '0.08em' }}>SMARTCARL</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ gap: 32 }} className="hidden md:flex">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" className="hidden md:block" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
            Anmelden
          </Link>
          <button onClick={() => setShowModal(true)} className="hidden md:flex" style={{
            height: 38, fontSize: 13, padding: '0 20px', fontFamily: 'var(--font-dm-sans, sans-serif)', fontWeight: 600,
            background: '#C74229', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.2s',
            alignItems: 'center', justifyContent: 'center'
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#D85640')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C74229')}>
            Anfragen
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E0E0E0', padding: '12px 24px 20px' }}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '11px 0', fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, color: '#555', textDecoration: 'none', borderBottom: '1px solid #E0E0E0' }}>
              {l.label}
            </a>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: 10, fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: '#888', textDecoration: 'none' }}>Anmelden</Link>
            <button onClick={() => { setOpen(false); setShowModal(true) }} style={{
              width: '100%', height: 48, background: '#C74229', color: '#fff', border: 'none', borderRadius: 4,
              fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase'
            }}>Anfragen</button>
          </div>
        </div>
      )}

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </header>
  )
}

/* ─────────────────────────────────────────────
   Hero – Zara-Style Light & Clean
   ───────────────────────────────────────────── */
export default function HeroSection() {
  const [ready, setReady] = useState(false)
  const [showModal, setShowModal] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t) }, [])

  return (
    <>
      <Navbar />

      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Hintergrundfoto */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/wien_blutgasse_a.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,7,0.74)', zIndex: 1 }} />

        {/* Inhalt */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Text – volle Breite */}
          <div style={{ maxWidth: 720, paddingTop: 100, paddingBottom: 60, opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(20px)', transition: 'opacity 0.65s ease, transform 0.65s ease' }}>
            <h1 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.08, color: '#FFFFFF', margin: '0 0 28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Schadensmeldungen, die sich mit nur<br />
              einem Klick von selbst erledigen.
            </h1>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 18, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)', margin: '0 0 40px', maxWidth: 560 }}>
              Mieter meldet den Schaden digital. CARL analysiert, klärt die Zuständigkeit
              und schlägt den passenden Handwerker vor. Sie bestätigen mit einem Klick,
              die Werkstatt wird automatisch informiert.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button onClick={() => setShowModal(true)} style={{
                height: 48, padding: '0 28px', background: '#C74229', color: '#fff', border: 'none', borderRadius: 4,
                fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D85640')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C74229')}>
                Anfragen
              </button>
              <a href="#ablauf" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
                Ablauf ansehen →
              </a>
            </div>
          </div>

          {/* Trust-Leiste */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 22, paddingBottom: 32, textAlign: 'center', opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease 0.35s' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              DSGVO-konform&nbsp;&nbsp;·&nbsp;&nbsp;Hosting in der EU&nbsp;&nbsp;·&nbsp;&nbsp;Persönliche Einführung inklusive
            </p>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; padding-top: 88px !important; }
          .hero-mockup { order: -1; }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </>
  )
}
