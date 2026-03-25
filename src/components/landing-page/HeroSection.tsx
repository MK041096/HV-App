'use client'

import { useEffect, useState } from 'react'
import { useShaderBackground } from '@/components/ui/animated-shader-hero'

export default function HeroSection() {
  const [ready, setReady] = useState(false)
  const shaderRef = useShaderBackground()

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Wien Innenstadt — Ringstraße, typische Wiener Fassaden */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />

      {/* Shader-Animation — animiertes Licht-Overlay über dem Wien-Foto */}
      <canvas
        ref={shaderRef}
        className="absolute inset-0 w-full h-full touch-none pointer-events-none"
        style={{ mixBlendMode: 'screen', opacity: 0.18 }}
      />

      {/* Cinematic Overlay — warm & dunkel wie Capacity */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, rgba(6,4,1,0.52) 0%, rgba(8,5,1,0.32) 45%, rgba(6,4,1,0.60) 100%)'
      }} />

      {/* Warmer Gold-Schimmer von unten */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(180,100,10,0.18) 0%, transparent 65%)'
      }} />

      {/* Übergang zum nächsten Abschnitt */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, transparent 62%, rgba(12,10,8,0.96) 94%, #0c0a08 100%)'
      }} />

      {/* Shimmer-Linie oben */}
      <div className="absolute top-0 left-0 right-0 lp-shimmer-line" />

      {/* Inhalt */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-32 pb-28">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-10 ${ready ? 'lp-anim-fade' : 'opacity-0'}`}
          style={{ animationDelay: '80ms' }}
        >
          <span className="lp-label">HAUSVERWALTUNG &nbsp;·&nbsp; AUTOMATISIERUNG</span>
        </div>

        {/* Headline */}
        <h1
          className={`font-playfair font-bold leading-[1.06] tracking-tight ${ready ? 'lp-anim-up' : 'opacity-0'}`}
          style={{ animationDelay: '180ms', textShadow: '0 2px 48px rgba(0,0,0,0.85)' }}
        >
          <span className="block text-white text-5xl md:text-6xl lg:text-[5rem]">
            Schadensmeldungen.
          </span>
          <span className="block lp-gold-text text-5xl md:text-6xl lg:text-[5rem] mt-1">
            Automatisiert.
          </span>
          <span className="block text-white text-5xl md:text-6xl lg:text-[5rem] mt-1">
            Kontrolliert.
          </span>
        </h1>

        {/* Subtext */}
        <p
          className={`mt-8 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${ready ? 'lp-anim-up' : 'opacity-0'}`}
          style={{
            animationDelay: '360ms',
            color: 'rgba(255,235,195,0.75)',
            textShadow: '0 1px 20px rgba(0,0,0,0.9)'
          }}
        >
          Die Plattform, die Ihre Hausverwaltung neu definiert — damit Ihr Team sich
          auf das konzentriert, was wirklich zählt.
        </p>

        {/* CTA Buttons */}
        <div
          className={`mt-10 flex flex-col sm:flex-row gap-4 justify-center ${ready ? 'lp-anim-up' : 'opacity-0'}`}
          style={{ animationDelay: '500ms' }}
        >
          <a href="#april-angebot" className="lp-btn-gold">April-Angebot sichern →</a>
          <a href="#wie-es-funktioniert" className="lp-btn-ghost">Wie es funktioniert</a>
        </div>

        {/* Trust-Karten — Glas */}
        <div
          className={`mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto ${ready ? 'lp-anim-fade' : 'opacity-0'}`}
          style={{ animationDelay: '680ms' }}
        >
          {[
            { value: '3 min', label: 'pro Meldung' },
            { value: '100%', label: 'Nachverfolgung' },
            { value: '0 €', label: 'Rückbuchungsrisiko' },
          ].map(item => (
            <div key={item.label} className="lp-glass py-4 px-3 text-center">
              <div className="text-xl font-bold text-white font-playfair">{item.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,220,160,0.55)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll-Indikator */}
      <div
        className="absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase"
        style={{
          transform: 'translateX(-50%)',
          animation: 'lp-scroll-bounce 2.2s ease-in-out infinite',
          color: 'rgba(255,210,140,0.45)'
        }}
      >
        <span>Scroll</span>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
