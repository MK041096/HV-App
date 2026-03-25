'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/* ──────────────────────────────────────────────────
   Hero Dashboard Mockup — HTML/CSS, kein echtes Bild
   ────────────────────────────────────────────────── */
function DashboardMockup() {
  const cases = [
    {
      status: 'NEU',
      statusColor: '#2E5540',
      statusBg: '#e8f2ed',
      title: 'Wasserschaden – Badezimmer',
      address: 'Musterstraße 12, Top 4',
      time: 'Heute, 09:14',
    },
    {
      status: 'IN BEARBEITUNG',
      statusColor: '#92600a',
      statusBg: '#fef3db',
      title: 'Riss in Außenwand',
      address: 'Beispielgasse 7, Top 8',
      time: 'Gestern, 14:32',
    },
    {
      status: 'ABGESCHLOSSEN',
      statusColor: '#6b7280',
      statusBg: '#f3f4f6',
      title: 'Defekte Heizung',
      address: 'Testweg 3, Top 2',
      time: 'Mo, 11:05',
    },
  ]

  return (
    <div
      style={{
        background: '#0A0A0A',
        border: '1px solid #2A2A2A',
        borderRadius: '12px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '520px',
      }}
    >
      {/* Browser titlebar */}
      <div style={{
        background: '#141414',
        borderBottom: '1px solid #222',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#3a3a3a', '#444', '#555'].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, marginLeft: '8px',
          background: '#1c1c1c', borderRadius: '4px',
          height: '22px', maxWidth: '220px',
          border: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', padding: '0 8px',
        }}>
          <span style={{ color: '#555', fontSize: '10px', fontFamily: 'monospace' }}>
            zerodamage.de/dashboard
          </span>
        </div>
      </div>

      {/* Dashboard inner panel */}
      <div style={{ background: '#F7F6F4', padding: '0' }}>
        {/* Dashboard header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #e8e6e2',
          background: '#fff',
        }}>
          <span style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '13px', fontWeight: 600, color: '#1a1a1a',
          }}>
            [SOFTWARE] · HV-Dashboard
          </span>
          <span style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '12px', color: '#6b7280',
            background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px',
            border: '1px solid #e5e7eb',
          }}>
            Alle Fälle (6)
          </span>
        </div>

        {/* Case cards */}
        <div style={{ padding: '10px' }}>
          {cases.map((c, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #e8e6e2',
                borderRadius: '7px',
                padding: '12px 14px',
                marginBottom: i < cases.length - 1 ? '7px' : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'default',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                {/* Status badge */}
                <span style={{
                  background: c.statusBg, color: c.statusColor,
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                  padding: '2px 6px', borderRadius: '3px',
                  whiteSpace: 'nowrap', marginTop: '1px',
                  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                }}>
                  {c.status}
                </span>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                    fontSize: '12.5px', fontWeight: 500, color: '#1a1a1a',
                    marginBottom: '2px',
                  }}>
                    {c.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                    fontSize: '11px', color: '#9ca3af',
                  }}>
                    {c.address} · {c.time}
                  </div>
                </div>
              </div>
              {/* Chevron */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Footer bar */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid #e8e6e2',
          display: 'flex', gap: '6px', background: '#fafaf9',
        }}>
          {['Übersicht', 'Mieter', 'Objekte', 'Archiv'].map((tab, i) => (
            <div key={tab} style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '11px', fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? '#2E5540' : '#9ca3af',
              padding: '4px 10px', borderRadius: '4px',
              background: i === 0 ? '#e8f2ed' : 'transparent',
              cursor: 'default',
            }}>
              {tab}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────
   Navbar — Sticky, transparent → blur on scroll
   ────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '64px',
        background: scrolled ? 'rgba(13,13,13,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #242424' : '1px solid transparent',
        transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
      }}
    >
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '0 24px', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Wordmark */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--font-dm-serif), Georgia, serif',
          fontSize: '18px', color: '#F4F3EF',
          textDecoration: 'none',
        }}>
          {/* House icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5540" strokeWidth="1.8">
            <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" strokeLinejoin="round"/>
          </svg>
          [SOFTWARE]
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}
          className="hidden md:flex">
          {['#funktionen', '#ablauf', '#vorteile', '#preise'].map((href, i) => (
            <a key={href} href={href} style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '14px', color: '#A09D99',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseOver={e => (e.currentTarget.style.color = '#F4F3EF')}
              onMouseOut={e => (e.currentTarget.style.color = '#A09D99')}
            >
              {['Funktionen', 'Ablauf', 'Vorteile', 'Preise'][i]}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/login" style={{
            fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
            fontSize: '14px', color: '#8A8680',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            className="hidden md:block"
            onMouseOver={e => (e.currentTarget.style.color = '#F4F3EF')}
            onMouseOut={e => (e.currentTarget.style.color = '#8A8680')}
          >
            Anmelden
          </Link>
          <a href="#preise" className="sw-btn-outline hidden md:inline-flex"
            style={{ height: '38px', fontSize: '13.5px', padding: '0 18px' }}>
            Demo anfragen
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A09D99', padding: '4px' }}
            className="md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid #242424', padding: '16px 24px 20px',
        }}>
          {['#funktionen', '#ablauf', '#vorteile', '#preise'].map((href, i) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '10px 0',
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '15px', color: '#A09D99', textDecoration: 'none',
              borderBottom: '1px solid #1a1a1a',
            }}>
              {['Funktionen', 'Ablauf', 'Vorteile', 'Preise'][i]}
            </a>
          ))}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/login" style={{
              textAlign: 'center', padding: '11px',
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '14px', color: '#8A8680', textDecoration: 'none',
            }}>
              Anmelden
            </Link>
            <a href="#preise" className="sw-btn-primary" onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'center' }}>
              Demo anfragen
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

/* ──────────────────────────────────────────────────
   Hero Section
   ────────────────────────────────────────────────── */
export default function HeroSection() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar />

      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

        {/* ── Hintergrundfoto mit Overlay ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/foto_gasse.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,7,7,0.74)',
          zIndex: 1,
        }} />

        {/* ── Inhalt ── */}
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 24px',
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 55fr) minmax(0, 45fr)',
            gap: '64px', alignItems: 'center',
            paddingTop: '100px', paddingBottom: '80px',
          }}
            className="hero-grid"
          >
            {/* ── Text ── */}
            <div
              style={{
                opacity: ready ? 1 : 0,
                transform: ready ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}
            >
              {/* H1 */}
              <h1 style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                lineHeight: 1.1,
                color: '#F4F3EF',
                margin: '0 0 24px 0',
                fontWeight: 400,
              }}>
                Schadensfälle digital erfassen.{' '}
                <br className="hidden md:block" />
                Sauber abwickeln.{' '}
                <br className="hidden md:block" />
                Lückenlos dokumentieren.
              </h1>

              {/* Subline */}
              <p style={{
                fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                fontSize: '17px', lineHeight: 1.7,
                color: '#A09D99',
                margin: '0 0 36px 0',
                maxWidth: '500px',
              }}>
                [SOFTWARE] strukturiert den Schadensprozess für Hausverwaltungen –
                von der ersten Mietermeldung bis zur vollständigen Dokumentation.
                Das System verarbeitet in Sekunden. Ihr Team entscheidet mit einem Klick.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <a href="#preise" className="sw-btn-primary">Demo anfragen</a>
                <a href="#ablauf" style={{
                  fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
                  fontSize: '15px', color: '#A09D99',
                  textDecoration: 'none', transition: 'color 0.2s',
                  padding: '4px 0',
                }}
                  onMouseOver={e => (e.currentTarget.style.color = '#F4F3EF')}
                  onMouseOut={e => (e.currentTarget.style.color = '#A09D99')}
                >
                  Ablauf ansehen →
                </a>
              </div>
            </div>

            {/* ── Dashboard Mockup ── */}
            <div
              style={{
                opacity: ready ? 1 : 0,
                transform: ready ? 'translateY(0)' : 'translateY(32px)',
                transition: 'opacity 0.8s ease 0.18s, transform 0.8s ease 0.18s',
                display: 'flex', justifyContent: 'center',
              }}
              className="hero-mockup"
            >
              <DashboardMockup />
            </div>
          </div>

          {/* ── Trust-Leiste ── */}
          <div
            style={{
              borderTop: '1px solid rgba(36,36,36,0.8)',
              paddingTop: '24px', paddingBottom: '32px',
              textAlign: 'center',
              opacity: ready ? 1 : 0,
              transition: 'opacity 0.8s ease 0.4s',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
              fontSize: '13px', color: '#8A8680',
              letterSpacing: '0.04em',
              margin: 0,
            }}>
              DSGVO-konform&nbsp;&nbsp;·&nbsp;&nbsp;Hosting in der EU&nbsp;&nbsp;·&nbsp;&nbsp;Für Hausverwaltungen ab 100 Einheiten
            </p>
          </div>
        </div>
      </section>

      {/* ── Mobile grid styles ── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding-top: 80px !important;
          }
          .hero-mockup {
            order: -1;
          }
        }
      `}</style>
    </>
  )
}
