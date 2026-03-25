import { Reveal } from './Reveal'

const capabilities = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Digitale Schadensmeldung',
    text: 'Mieter melden per Foto & Text — strukturiert, sofort, ohne Anruf.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: 'Automatische Analyse',
    text: 'Wer haftet? Mieter, Vermieter oder Versicherung? Das System entscheidet.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    title: 'Handwerker-Management',
    text: 'Passenden Handwerker nach Gewerk vorschlagen & automatisch beauftragen.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Versicherungsblatt',
    text: 'Automatisch befüllt. In Sekunden fertig. Kein Formular per Hand.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Mieterverwaltung',
    text: 'Mieter, Einheiten, Dokumente — alles strukturiert an einem Ort.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Vollständige Kontrolle',
    text: 'Jeder Fall, jeder Status — transparent und nachverfolgbar.',
  },
]

export default function PricingSection() {
  return (
    <section id="preise" className="bg-[#f5f0e8] py-28 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <Reveal className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: '#b85c0a' }}>
            LEISTUNGSUMFANG
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold leading-tight" style={{ color: '#1a1208' }}>
            Alles für moderne<br />Hausverwaltungen — in einem.
          </h2>
          <p className="mt-4 text-[#6b5c42] text-base max-w-lg mx-auto">
            Kein Flickwerk aus Tools. Alles in einem System.
          </p>
        </Reveal>

        {/* 3-column feature cards — Rogo style */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-20">
          {capabilities.map((cap, i) => (
            <Reveal key={cap.title} direction="up" delay={i * 60}>
              <div
                className="p-6 rounded-xl h-full"
                style={{
                  background: '#ede8de',
                  border: '1px solid rgba(26,18,8,0.08)',
                }}
              >
                <div className="mb-4" style={{ color: '#b85c0a' }}>
                  {cap.icon}
                </div>
                <h3 className="font-semibold text-[#1a1208] text-sm mb-2">{cap.title}</h3>
                <p className="text-[#6b5c42] text-sm leading-relaxed">{cap.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Pricing card */}
        <Reveal>
          <div className="max-w-lg mx-auto rounded-2xl overflow-hidden"
            style={{
              background: '#1a1208',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top banner */}
            <div className="px-8 py-3 text-center text-xs font-bold tracking-[0.18em] uppercase"
              style={{ background: '#b85c0a', color: 'white' }}>
              🔥 Gründerangebot — nur noch wenige Plätze
            </div>

            <div className="px-8 md:px-12 py-10 text-center">
              <div className="mb-1">
                <span className="font-playfair text-5xl font-bold" style={{ color: '#d97706' }}>349 €</span>
              </div>
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span className="line-through">699 €</span> · einmalige Einrichtungsgebühr
              </p>
              <p className="text-sm mt-4 mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Danach ab{' '}
                <strong className="text-white">0,50 € / Einheit / Monat</strong> im Gründerpreis.
              </p>

              <a
                href="#april-angebot"
                className="inline-flex items-center justify-center w-full py-3.5 rounded text-white text-sm font-semibold tracking-wide transition-all duration-200"
                style={{ background: '#b85c0a', border: 'none' }}
                onMouseOver={e => (e.currentTarget.style.background = '#d97706')}
                onMouseOut={e => (e.currentTarget.style.background = '#b85c0a')}
              >
                Jetzt Platz sichern →
              </a>

              <div className="mt-8 flex items-center justify-center gap-6">
                {['30 Tage Garantie', 'DSGVO-konform', 'EU-Server'].map(t => (
                  <span key={t} className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
