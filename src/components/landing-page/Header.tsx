'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#09090f]/95 backdrop-blur-md border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="font-playfair text-xl font-bold text-white group-hover:text-[#c9a44c] transition-colors duration-300 tracking-wide">
              zerodamage<span className="text-[#c9a44c]">.</span>de
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#wie-es-funktioniert" className="text-sm text-[#a0a0b0] hover:text-white transition-colors duration-200">
              So funktioniert es
            </a>
            <a href="#preise" className="text-sm text-[#a0a0b0] hover:text-white transition-colors duration-200">
              Preise
            </a>
            <Link href="/login" className="text-sm text-[#a0a0b0] hover:text-white transition-colors duration-200">
              Login
            </Link>
            <a href="#april-angebot" className="lp-btn-gold !py-2.5 !px-5 !text-sm">
              April-Angebot sichern
            </a>
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[#a0a0b0] hover:text-white"
            aria-label="Menü öffnen"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#09090f]/98 backdrop-blur-md border-t border-white/[0.06] px-6 py-4 space-y-1">
          <a href="#wie-es-funktioniert" onClick={() => setMenuOpen(false)} className="block text-sm text-[#a0a0b0] hover:text-white py-2.5">So funktioniert es</a>
          <a href="#preise" onClick={() => setMenuOpen(false)} className="block text-sm text-[#a0a0b0] hover:text-white py-2.5">Preise</a>
          <Link href="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-[#a0a0b0] hover:text-white py-2.5">Login</Link>
          <a href="#april-angebot" onClick={() => setMenuOpen(false)} className="lp-btn-gold block text-center text-sm mt-3">April-Angebot sichern</a>
        </div>
      )}
    </header>
  )
}
