'use client'

import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t) }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#09090f]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516550893885-985c836c48e0?auto=format&fit=crop&w=1920&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090f]/82 via-[#09090f]/70 to-[#09090f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,164,76,0.06)_0%,transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 lp-shimmer-line" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-24">
        <div className={`lp-label mb-10 ${ready ? 'lp-anim-fade' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          Österreich &nbsp;·&nbsp; Hausverwaltung &nbsp;·&nbsp; Automatisierung
        </div>

        <h1 className="font-playfair font-bold leading-[1.06] text-white">
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            Schadensmeldungen.
          </span>
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] lp-gold-text ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '420ms' }}>
            Automatisiert.
          </span>
          <span className={`block text-5xl md:text-7xl lg:text-[5.5rem] ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '640ms' }}>
            Kontrolliert.
          </span>
        </h1>

        <p className={`mt-8 text-lg md:text-xl text-[#a0a0b0] max-w-2xl mx-auto leading-relaxed ${ready ? 'lp-anim-up' : 'opacity-0'}`} style={{ animationDelay: '860ms' }}>
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
            <div key={item.text} className="flex items-center gap-2.5 text-sm text-[#7a7a90]">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5 text-[#5a5a70] text-[10px] tracking-[0.2em] uppercase"
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
