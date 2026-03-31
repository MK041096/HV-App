'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    org_name: '',
    email: '',
    phone: '',
    units_estimate: '',
    privacy_accepted: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }))
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.privacy_accepted) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      } else {
        setSuccess(true)
      }
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
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 49,
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
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            padding: '32px',
            position: 'relative',
            pointerEvents: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F5F5F5',
              border: '1px solid #E0E0E0',
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            ×
          </button>

          {success ? (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 20px' }}>
                <circle cx="32" cy="32" r="32" fill="rgba(34,197,94,0.1)" />
                <circle cx="32" cy="32" r="24" fill="rgba(34,197,94,0.15)" />
                <path d="M21 32l8 8 14-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '26px', color: '#000', margin: '0 0 12px', fontWeight: 700 }}>
                Anfrage eingegangen!
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px' }}>
                Wir melden uns persönlich bei Ihnen, üblicherweise innerhalb von 24 Stunden. Keine Zahlung, keine Verpflichtung.
              </p>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  height: '50px',
                  background: '#C74229',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: 'var(--font-dm-sans, sans-serif)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#D85640' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#C74229' }}
              >
                Fenster schließen
              </button>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(199,66,41,0.06)',
                  border: '1px solid rgba(199,66,41,0.2)',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  marginBottom: '14px',
                }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#C74229', fontWeight: 600, fontFamily: 'var(--font-dm-sans, sans-serif)', textTransform: 'uppercase' }}>
                    UNVERBINDLICH
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '28px', color: '#000', margin: '0 0 6px', fontWeight: 700, lineHeight: 1.2 }}>
                  Jetzt anfragen
                </h2>
                <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', fontSize: '14px', margin: 0 }}>
                  Keine Zahlung, wir melden uns persönlich bei Ihnen.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* First + Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Vorname *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Max"
                      required
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nachname *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Mustermann"
                      required
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                    />
                  </div>
                </div>

                {/* Company name */}
                <div>
                  <label style={labelStyle}>Firmenname der Hausverwaltung</label>
                  <input
                    type="text"
                    name="org_name"
                    value={form.org_name}
                    onChange={handleChange}
                    placeholder="Muster Hausverwaltung GmbH"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>E-Mail-Adresse *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="max@muster-hv.at"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Telefonnummer (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+43 664 123 456"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  />
                </div>

                {/* Units estimate */}
                <div>
                  <label style={labelStyle}>Wie viele Einheiten verwalten Sie ca.?</label>
                  <select
                    name="units_estimate"
                    value={form.units_estimate}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 18px center',
                      paddingRight: '42px',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#C74229' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0' }}
                  >
                    <option value="" style={{ background: '#fff' }}>Bitte wählen</option>
                    <option value="Bis 100 Einheiten" style={{ background: '#fff' }}>Bis 100 Einheiten</option>
                    <option value="100–500 Einheiten" style={{ background: '#fff' }}>100–500 Einheiten</option>
                    <option value="500–1.000 Einheiten" style={{ background: '#fff' }}>500–1.000 Einheiten</option>
                    <option value="1.000–3.000 Einheiten" style={{ background: '#fff' }}>1.000–3.000 Einheiten</option>
                    <option value="Mehr als 3.000 Einheiten" style={{ background: '#fff' }}>Mehr als 3.000 Einheiten</option>
                  </select>
                </div>

                {/* Privacy checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="privacy_accepted"
                    checked={form.privacy_accepted}
                    onChange={handleChange}
                    required
                    style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#C74229', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#555', lineHeight: 1.5 }}>
                    Ich akzeptiere die{' '}
                    <a
                      href="/datenschutz"
                      rel="noopener noreferrer"
                      style={{ color: '#C74229', textDecoration: 'underline' }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('/datenschutz', '_blank', 'noopener,noreferrer') }}
                    >
                      Datenschutzerklärung
                    </a>
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '6px',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontFamily: 'var(--font-dm-sans, sans-serif)',
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: '50px',
                    background: isLoading ? 'rgba(199,66,41,0.5)' : '#C74229',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '15px',
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                  onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#D85640' }}
                  onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#C74229' }}
                >
                  {isLoading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Wird gesendet...
                    </>
                  ) : (
                    'Unverbindlich anfragen →'
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '12px', fontFamily: 'var(--font-dm-sans, sans-serif)', color: '#888', margin: 0 }}>
                  Keine Zahlung, keine Verpflichtung. Wir melden uns bei Ihnen.
                </p>
              </div>
            </form>
          )}
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
