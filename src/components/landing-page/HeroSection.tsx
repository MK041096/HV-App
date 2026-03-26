'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OnboardingModal from './OnboardingModal'

/* ─────────────────────────────────────────────
   Dashboard Mockup – reines HTML/CSS, kein Bild
   ───────────────────────────────────────────── */
function DashboardMockup() {
  const cases = [
    { status: 'NEU',            bg: '#e6f0ec', color: '#2E5540', title: 'Wasserschaden – Badezimmer',  addr: 'Musterstraße 12, Top 4',  time: 'Heute, 09:14'   },
    { status: 'IN BEARBEITUNG', bg: '#fef3db', color: '#92600a', title: 'Riss in Außenwand',           addr: 'Beispielgasse 7, Top 8', time: 'Gestern, 14:32' },
    { status: 'ABGESCHLOSSEN',  bg: '#f3f4f6', color: '#6b7280', title: 'Defekte Heizung',             addr: 'Testweg 3, Top 2',       time: 'Mo, 11:05'      },
  ]

  return (
    <div style={{
      background: '#0A0A0A',
      border: '1px solid #2A2A2A',
      borderRadius: 12,
      boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: 500,
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#141414', borderBottom: '1px solid #222', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#3a3a3a','#444','#555'].map((c,i) => <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, marginLeft: 8, background: '#1c1c1c', borderRadius: 4, height: 22, maxWidth: 200, border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ color: '#555', fontSize: 10, fontFamily: 'monospace' }}>app.zerodamage.de/dashboard</span>
        </div>
      </div>

      {/* Light inner panel */}
      <div style={{ background: '#F7F6F4' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid #e8e6e2', background: '#fff' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>[SOFTWARE] · HV-Dashboard</span>
          <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: 4, border: '1px solid #e5e7eb' }}>Alle Fälle (6)</span>
        </div>

        {/* Cards */}
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {cases.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e6e2', borderRadius: 7, padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                <span style={{ background: c.bg, color: c.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap', marginTop: 2, fontFamily: 'var(--font-dm-sans, sans-serif)' }}>{c.status}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 12.5, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11, color: '#9ca3af' }}>{c.addr} · {c.time}</div>
                </div>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ padding: '9px 18px', borderTop: '1px solid #e8e6e2', background: '#fafaf9', display: 'flex', gap: 4 }}>
          {['Übersicht','Mieter','Objekte','Archiv'].map((t, i) => (
            <span key={t} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 11, fontWeight: i===0?600:400, color: i===0?'#2E5540':'#9ca3af', padding: '4px 9px', borderRadius: 4, background: i===0?'#e6f0ec':'transparent' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Navbar – Sektion 1
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
    { label: 'Vorteile',   href: '#vorteile'   },
    { label: 'Preise',     href: '#preise'     },
  ]

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(13,13,13,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      transition: 'background 0.35s, border-color 0.35s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Wordmark */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1v-10.5z" stroke="#B5834A" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
            <path d="M9 22v-7h6v7" stroke="#B5834A" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M12 7v4" stroke="#9A6B3C" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 18, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>[SOFTWARE]</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 32 }} className="hidden md:flex">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" className="hidden md:block" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Anmelden
          </Link>
          <button onClick={() => setShowModal(true)} className="hidden md:inline-flex sw-btn-outline" style={{ height: 38, fontSize: 13.5, padding: '0 18px' }}>
            Anfragen
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)', padding: '12px 24px 20px' }}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '11px 0', fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid #1a1a1a' }}>
              {l.label}
            </a>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', padding: 10, fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Anmelden</Link>
            <button onClick={() => { setOpen(false); setShowModal(true) }} className="sw-btn-primary" style={{ justifyContent: 'center', width: '100%' }}>Anfragen</button>
          </div>
        </div>
      )}

      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
    </header>
  )
}

/* ─────────────────────────────────────────────
   Hero – Sektion 2
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

          {/* Zweispaltig */}
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 64, alignItems: 'center', paddingTop: 100, paddingBottom: 60 }}>

            {/* Text */}
            <div style={{ opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(20px)', transition: 'opacity 0.65s ease, transform 0.65s ease' }}>
              <h1 style={{ fontFamily: 'var(--font-dm-serif, Georgia, serif)', fontSize: 'clamp(2.1rem, 4vw, 3.5rem)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 24px', fontWeight: 400 }}>
                Schadensmeldungen, die Ihr Team<br />
                in unter 3 Minuten bearbeitet.
              </h1>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 36px', maxWidth: 480 }}>
                Mieter meldet digital. Das System analysiert vollständig und bereitet
                Einschätzung, Handwerker und Dokumentation vor.
                Ihr Mitarbeiter prüft auf einen Blick — und klickt einmal.
                Was heute 20 Minuten kostet, dauert unter 3.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setShowModal(true)} className="sw-btn-primary">Anfragen</button>
                <a href="#ablauf" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  Ablauf ansehen →
                </a>
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="hero-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
              <DashboardMockup />
            </div>
          </div>

          {/* Trust-Leiste */}
          <div style={{ borderTop: '1px solid rgba(36,36,36,0.7)', paddingTop: 22, paddingBottom: 32, textAlign: 'center', opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease 0.35s' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 13, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.03em' }}>
              DSGVO-konform&nbsp;&nbsp;·&nbsp;&nbsp;Hosting in der EU&nbsp;&nbsp;·&nbsp;&nbsp;Kein langfristiger Vertrag
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
