'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type Plan = 'monthly' | 'yearly'
type Country = 'AT' | 'DE' | 'CH'

interface FormState {
  first_name: string
  last_name: string
  org_name: string
  email: string
  einheiten_anzahl: string
  plan: Plan
  country: Country
  privacy_accepted: boolean
  avv_accepted: boolean
}

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    org_name: '',
    email: '',
    einheiten_anzahl: '',
    plan: 'monthly',
    country: 'AT',
    privacy_accepted: false,
    avv_accepted: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }))
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }))
    }
  }

  function setPlan(p: Plan) {
    setForm((prev) => ({ ...prev, plan: p }))
  }

  // Price display
  const unitCount = parseInt(form.einheiten_anzahl || '0', 10)
  const monthlyPricePerUnit = form.plan === 'yearly' ? 0.85 : 1.00
  const monthlyTotal = unitCount > 0 ? (unitCount * monthlyPricePerUnit).toFixed(2) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.privacy_accepted) { setError('Bitte akzeptieren Sie die Datenschutzerklärung.'); return }
    if (!form.avv_accepted) { setError('Bitte akzeptieren Sie den Auftragsverarbeitungsvertrag (AVV).'); return }

    const units = parseInt(form.einheiten_anzahl, 10)
    if (!units || units < 1) { setError('Bitte geben Sie die Anzahl Ihrer Einheiten ein.'); return }

    setIsLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name:         form.org_name,
          first_name:       form.first_name,
          last_name:        form.last_name,
          email:            form.email,
          einheiten_anzahl: units,
          plan:             form.plan,
          country:          form.country,
          privacy_accepted: true,
          avv_accepted:     true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    background: '#F5F5F5',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    padding: '0 18px',
    color: '#000',
    fontSize: '14px',
    fontFamily: 'var(--font-dm-sans, sans-serif)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontFamily: 'var(--font-dm-sans, sans-serif)',
    fontWeight: 500,
    color: '#555',
    marginBottom: '6px',
    paddingLeft: '4px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)', zIndex: 49,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: '12px',
            padding: '32px', position: 'relative', pointerEvents: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#F5F5F5', border: '1px solid #E0E0E0',
              color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '16px', lineHeight: 1, transition: 'background 0.15s',
            }}
          >
            ×
          </button>

          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(199,66,41,0.06)', border: '1px solid rgba(199,66,41,0.2)',
                borderRadius: '4px', padding: '4px 12px', marginBottom: '12px',
              }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#C74229', fontWeight: 600, fontFamily: 'var(--font-dm-sans, sans-serif)', textTransform: 'uppercase' }}>
                  14 TAGE GRATIS TESTEN
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '26px', color: '#000', margin: '0 0 6px', fontWeight: 700, lineHeight: 1.2 }}>
                Jetzt starten
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', fontSize: '14px', margin: 0 }}>
                Keine Zahlung in den ersten 14 Tagen — Sie können jederzeit kündigen.
              </p>
            </div>

            {/* Plan toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Abrechnungsart</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['monthly', 'yearly'] as Plan[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    style={{
                      padding: '10px 8px',
                      border: form.plan === p ? '2px solid #C74229' : '1px solid #E0E0E0',
                      borderRadius: '6px',
                      background: form.plan === p ? 'rgba(199,66,41,0.05)' : '#F5F5F5',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-sans, sans-serif)',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: form.plan === p ? '#C74229' : '#333' }}>
                      {p === 'monthly' ? 'Monatlich' : 'Jährlich'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                      {p === 'monthly' ? '1,00 € / Einheit' : '0,85 € / Einheit '}
                      {p === 'yearly' && <span style={{ color: '#16a34a', fontWeight: 600 }}>-15%</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* First + Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Vorname *</label>
                  <input type="text" name="first_name" value={form.first_name} onChange={handleChange}
                    placeholder="Max" required style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nachname *</label>
                  <input type="text" name="last_name" value={form.last_name} onChange={handleChange}
                    placeholder="Mustermann" required style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>
              </div>

              {/* Org name */}
              <div>
                <label style={labelStyle}>Firmenname *</label>
                <input type="text" name="org_name" value={form.org_name} onChange={handleChange}
                  placeholder="Muster Hausverwaltung GmbH" required style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>E-Mail-Adresse *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="max@muster-hv.at" required style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                />
              </div>

              {/* Units + Country row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Anzahl Einheiten *</label>
                  <input type="number" name="einheiten_anzahl" value={form.einheiten_anzahl} onChange={handleChange}
                    placeholder="z. B. 150" min="1" max="9999" required style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Land *</label>
                  <select name="country" value={form.country} onChange={handleChange} required
                    style={{
                      ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  >
                    <option value="AT">🇦🇹 Österreich</option>
                    <option value="DE">🇩🇪 Deutschland</option>
                    <option value="CH">🇨🇭 Schweiz</option>
                  </select>
                </div>
              </div>

              {/* Price preview */}
              {monthlyTotal && (
                <div style={{
                  padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
                    Ihr monatlicher Beitrag
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#166534', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
                    {monthlyTotal} €{form.plan === 'yearly' ? ' / Monat' : ''}
                  </span>
                </div>
              )}

              {/* Privacy checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="privacy_accepted" checked={form.privacy_accepted} onChange={handleChange}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#C74229', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', lineHeight: 1.5 }}>
                  Ich akzeptiere die{' '}
                  <a href="/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: '#C74229', textDecoration: 'underline' }}>
                    Datenschutzerklärung
                  </a>
                </span>
              </label>

              {/* AVV checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="avv_accepted" checked={form.avv_accepted} onChange={handleChange}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#C74229', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', lineHeight: 1.5 }}>
                  Ich akzeptiere den{' '}
                  <a href="/avv" target="_blank" rel="noopener noreferrer" style={{ color: '#C74229', textDecoration: 'underline' }}>
                    Auftragsverarbeitungsvertrag (AVV)
                  </a>
                  {' '}gemäß Art. 28 DSGVO
                </span>
              </label>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px',
                    color: '#dc2626', fontSize: '13px', fontFamily: 'var(--font-dm-sans, sans-serif)', lineHeight: 1.5,
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', height: '50px',
                  background: isLoading ? 'rgba(199,66,41,0.5)' : '#C74229',
                  border: 'none', borderRadius: '4px', color: '#fff', fontSize: '15px',
                  fontFamily: 'var(--font-dm-sans, sans-serif)', fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginTop: '4px', letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#D85640' }}
                onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#C74229' }}
              >
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Wird vorbereitet...
                  </>
                ) : (
                  'Weiter zur sicheren Zahlung →'
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#888', margin: 0 }}>
                🔒 Sichere Zahlung via Stripe · 14 Tage gratis · Aktionscode: APRIL26
              </p>
            </div>
          </form>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
