'use client'

import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t) }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#09090f]">
      {/* Vienna Altstadt photo — visible through lighter overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80')" }}
      />
      {/* Lighter overlay so buildings show through */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(9,9,15,0.48) 0%, rgba(9,9,15,0.38) 40%, rgba(9,9,15,0.82) 85%, rgba(9,9,15,1) 100%)' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(201,164,76,0.10)_0%,transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 lp-shimmer-line" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-24">
        <div className={`lp-label mb-10 ${ready ? 'lp-anim-fade' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          Österreich &nbsp;·&nbsp; Hausverwaltung &nbsp;·&nbsp; Automatisierung
        </div>

        <h1 className="font-playfair font-bold leading-[1.06]" style={{ textShadow: '0 2px 24px rgba(9,9,15,0.85)' }}>
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] text-white ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            Schadensmeldungen.
          </span>
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] lp-gold-text ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '420ms' }}>
            Automatisiert.
          </span>
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] text-white ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '640ms' }}>
            Kontrolliert.
          </span>
        </h1>

        <p className={`mt-8 text-lg md:text-xl text-[#c8c8d8] max-w-2xl mx-auto leading-relaxed ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '860ms', textShadow: '0 1px 10px rgba(9,9,15,0.95)' }}>
          Die Plattform, die Ihre Hausverwaltung neu definiert — damit Ihr Team sich auf das konzentriert, was wirklich zählt.
        </p>

        <div className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '1020ms' }}>
          <a href="#april-angebot" className="lp-btn-gold">April-Angebot sichern →</a>
          <a href="#wie-es-funktioniert" className="lp-btn-ghost">Wie es funktioniert</a>
        </div>

        <div className={`mt-14 flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center items-center ${ready ? 'lp-anim-fade' : 'opacity-0'}`} style={{ animationDelay: '1200ms' }}>
          {[
            { icon: '⚡', text: '1-Klick-Entscheidung' },
            { icon: '🔍', text: 'Automatische Schadensanalyse' },
            { icon: '📈', text: 'Skalieren ohne Neueinstellungen' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2.5 text-sm text-[#a8a8b8]" style={{ textShadow: '0 1px 6px rgba(9,9,15,0.9)' }}>
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5 text-[#8a8a9a] text-[10px] tracking-[0.2em] uppercase"
        style={{ transform: 'translateX(-50%)', animation: 'lp-scroll-bounce 2.2s ease-in-out infinite' }}
      >
        <span>Scroll</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
