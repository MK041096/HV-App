'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useShaderBackground } from '@/components/ui/animated-shader-hero'

const trustLogos = [
  'Immo GmbH', 'WohnGut AG', 'Ringstraße HV', 'Stadtbau Wien', 'Alpine Verwaltung', 'Donau Immo'
]

export default function HeroSection() {
  const [ready, setReady] = useState(false)
  const shaderRef = useShaderBackground()

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative h-screen min-h-[600px] flex flex-col items-center justify-center overflow-hidden">

      {/* Wien Innenstadt — Ringstraße */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      />

      {/* WebGL Shader — animierte Lichtbewegung über dem Foto */}
      <canvas
        ref={shaderRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen', opacity: 0.12 }}
      />

      {/* Dark cinematic overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(5,4,2,0.68) 0%, rgba(5,4,2,0.52) 50%, rgba(5,4,2,0.78) 100%)'
      }} />

      {/* Fade to black at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40" style={{
        background: 'linear-gradient(to bottom, transparent, #080604)'
      }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center">

        {/* Headline */}
        <h1
          className={`font-playfair font-bold text-white leading-[1.04] tracking-tight transition-all duration-700 ${
            ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ textShadow: '0 2px 60px rgba(0,0,0,0.9)', transitionDelay: '100ms' }}
        >
          <span className="block text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Die Hausverwaltungs-
          </span>
          <span className="block text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Plattform für Österreich.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-7 text-base sm:text-lg max-w-xl mx-auto leading-relaxed transition-all duration-700 ${
            ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{
            color: 'rgba(240,225,200,0.70)',
            textShadow: '0 1px 24px rgba(0,0,0,0.8)',
            transitionDelay: '220ms'
          }}
        >
          Schadensmeldungen automatisiert bearbeiten — damit Ihr Team sich auf das konzentriert, was wirklich zählt.
        </p>

        {/* CTA */}
        <div
          className={`mt-10 flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 ${
            ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '340ms' }}
        >
          <a
            href="#april-angebot"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded border border-white/30 text-white text-sm font-medium tracking-wide hover:bg-white/10 hover:border-white/50 transition-all duration-200 backdrop-blur-sm"
          >
            Demo anfragen →
          </a>
          <a
            href="#wie-es-funktioniert"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded border border-white/10 text-white/60 text-sm font-medium tracking-wide hover:text-white/90 hover:border-white/25 transition-all duration-200"
          >
            Wie es funktioniert
          </a>
        </div>

        {/* Trust logos */}
        <div
          className={`mt-16 transition-all duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          <p className="text-xs tracking-[0.2em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Vertrauen führender Hausverwaltungen in Österreich
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustLogos.map(name => (
              <span
                key={name}
                className="font-playfair text-sm font-semibold"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ animation: 'lp-scroll-bounce 2.2s ease-in-out infinite' }}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: 'rgba(255,210,140,0.35)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
