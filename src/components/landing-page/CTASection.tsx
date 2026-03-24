'use client'

import { useState } from 'react'
import { Reveal } from './Reveal'

export default function CTASection() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email }),
      })
      if (!res.ok) throw new Error('Fehler')
      setSent(true)
    } catch {
      setError('Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="april-angebot" className="relative bg-[#0d0d16] py-28 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,164,76,0.07)_0%,transparent_65%)]" />
      <div className="absolute top-0 left-0 right-0 lp-shimmer-line" />

      <div className="relative max-w-2xl mx-auto">
        <Reveal className="text-center mb-10">
          <div className="lp-label mb-5 mx-auto w-fit">
            🔥 April-Angebot — nur noch wenige Plätze
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
            Jetzt einsteigen.<br />
            <span className="lp-gold-text">50 % sparen.</span>
          </h2>
          <p className="text-[#8a8a9a] text-lg leading-relaxed max-w-lg mx-auto">
            Erster Monat gratis. Einrichtungsgebühr 349 € statt 699 €.
            Nur für die ersten 10 Hausverwaltungen, die sich im April registrieren.
          </p>
        </Reveal>

        <Reveal delay={100}>
          {!sent ? (
            <form onSubmit={handleSubmit} className="lp-glass p-8 md:p-10 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-[#7a7a90] mb-2 tracking-wide uppercase">Ihr Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-[#4a4a5a] focus:outline-none focus:border-[#c9a44c]/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7a7a90] mb-2 tracking-wide uppercase">Firma</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Mustermann HV GmbH"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-[#4a4a5a] focus:outline-none focus:border-[#c9a44c]/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#7a7a90] mb-2 tracking-wide uppercase">E-Mail-Adresse</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="max@mustermann-hv.at"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-[#4a4a5a] focus:outline-none focus:border-[#c9a44c]/50 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="lp-btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gesendet...' : 'April-Angebot sichern →'}
              </button>

              <p className="text-[#4a4a5a] text-xs text-center leading-relaxed">
                Mit der Anfrage stimmen Sie unserer{' '}
                <a href="/datenschutz" className="text-[#7a7a90] hover:text-[#c9a44c] transition-colors">Datenschutzerklärung</a>
                {' '}zu. Kein Spam, keine Weitergabe Ihrer Daten.
              </p>
            </form>
          ) : (
            <div className="lp-glass p-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-playfair text-2xl font-bold text-white mb-3">Anfrage erhalten!</h3>
              <p className="text-[#8a8a9a] leading-relaxed">
                Vielen Dank, <strong className="text-white">{name}</strong>. Wir melden uns innerhalb von
                24 Stunden bei Ihnen. Sie erhalten eine Bestätigung an <strong className="text-[#c9a44c]">{email}</strong>.
              </p>
            </div>
          )}
        </Reveal>

        {/* Trust signals */}
        <Reveal delay={200} className="mt-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '🔒', text: 'DSGVO-konform' },
              { icon: '🇦🇹', text: 'EU-Server' },
              { icon: '✋', text: '30 Tage Garantie' },
            ].map(t => (
              <div key={t.text} className="flex flex-col items-center gap-1.5">
                <span className="text-xl">{t.icon}</span>
                <span className="text-[#5a5a70] text-xs">{t.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
