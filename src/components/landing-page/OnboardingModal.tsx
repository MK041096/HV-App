'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    org_name: '',
    email: '',
    password: '',
    phone: '',
    units_estimate: '',
    privacy_accepted: false,
    avv_accepted: false,
  })
  const [showPassword, setShowPassword] = useState(false)
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
    if (!form.avv_accepted) {
      setError('Bitte akzeptieren Sie den Auftragsverarbeitungsvertrag.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register-hv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          org_name: form.org_name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          units_estimate: form.units_estimate || undefined,
          privacy_accepted: true,
          avv_accepted: true,
        }),
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
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '999px',
    padding: '0 18px',
    color: '#F5F0E8',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: '#A09488',
    marginBottom: '6px',
    paddingLeft: '4px',
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
          background: 'rgba(0,0,0,0.75)',
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
            background: 'rgba(14,12,9,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '32px',
            position: 'relative',
            pointerEvents: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(154,107,60,0.4) transparent',
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
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#A09488',
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
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                style={{ margin: '0 auto 20px' }}
              >
                <circle cx="32" cy="32" r="32" fill="rgba(34,197,94,0.15)" />
                <circle cx="32" cy="32" r="24" fill="rgba(34,197,94,0.2)" />
                <path
                  d="M21 32l8 8 14-16"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  fontSize: '26px',
                  color: '#F5F0E8',
                  margin: '0 0 12px',
                  fontWeight: 400,
                }}
              >
                Registrierung eingegangen!
              </h2>
              <p
                style={{
                  color: '#A09488',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  margin: '0 0 28px',
                }}
              >
                Wir prüfen Ihre Anfrage und schalten Ihren Zugang innerhalb von 24 Stunden frei. Sie erhalten eine E-Mail sobald Ihr Konto aktiv ist.
              </p>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  height: '50px',
                  background: '#9A6B3C',
                  border: 'none',
                  borderRadius: '999px',
                  color: '#F5F0E8',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#B5834A' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#9A6B3C' }}
              >
                Fenster schließen
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(154,107,60,0.15)',
                    border: '1px solid rgba(154,107,60,0.3)',
                    borderRadius: '999px',
                    padding: '4px 12px',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#B5834A', fontWeight: 600 }}>
                    SOFTWARE
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    fontSize: '28px',
                    color: '#F5F0E8',
                    margin: '0 0 6px',
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  April-Aktion sichern
                </h2>
                <p style={{ color: '#A09488', fontSize: '14px', margin: 0 }}>
                  Nur 3 Plätze im April · 349 € statt 699 € Onboarding
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
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
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
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                    />
                  </div>
                </div>

                {/* Company name */}
                <div>
                  <label style={labelStyle}>Firmenname der Hausverwaltung *</label>
                  <input
                    type="text"
                    name="org_name"
                    value={form.org_name}
                    onChange={handleChange}
                    placeholder="Muster Hausverwaltung GmbH"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
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
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={labelStyle}>Passwort *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mindestens 8 Zeichen"
                      required
                      minLength={8}
                      style={{ ...inputStyle, paddingRight: '50px' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#A09488',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b6059', marginTop: '5px', paddingLeft: '4px' }}>
                    Mindestens 8 Zeichen
                  </p>
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
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
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
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A09488' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 18px center',
                      paddingRight: '42px',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(181,131,74,0.6)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                  >
                    <option value="" style={{ background: '#1a1714' }}>Bitte wählen</option>
                    <option value="Bis 100 Einheiten" style={{ background: '#1a1714' }}>Bis 100 Einheiten</option>
                    <option value="100–500 Einheiten" style={{ background: '#1a1714' }}>100–500 Einheiten</option>
                    <option value="500–1.000 Einheiten" style={{ background: '#1a1714' }}>500–1.000 Einheiten</option>
                    <option value="1.000–3.000 Einheiten" style={{ background: '#1a1714' }}>1.000–3.000 Einheiten</option>
                    <option value="Mehr als 3.000 Einheiten" style={{ background: '#1a1714' }}>Mehr als 3.000 Einheiten</option>
                  </select>
                </div>

                {/* Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="privacy_accepted"
                      checked={form.privacy_accepted}
                      onChange={handleChange}
                      required
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '2px',
                        accentColor: '#9A6B3C',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#A09488', lineHeight: 1.5 }}>
                      Ich akzeptiere die{' '}
                      <a
                        href="/datenschutz"
                        rel="noopener noreferrer"
                        style={{ color: '#B5834A', textDecoration: 'underline' }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('/datenschutz', '_blank', 'noopener,noreferrer') }}
                      >
                        Datenschutzerklärung
                      </a>
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="avv_accepted"
                      checked={form.avv_accepted}
                      onChange={handleChange}
                      required
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '2px',
                        accentColor: '#9A6B3C',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#A09488', lineHeight: 1.5 }}>
                      Ich akzeptiere den{' '}
                      <a
                        href="/avv"
                        rel="noopener noreferrer"
                        style={{ color: '#B5834A', textDecoration: 'underline' }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open('/avv', '_blank', 'noopener,noreferrer') }}
                      >
                        Auftragsverarbeitungsvertrag
                      </a>
                    </span>
                  </label>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px',
                      color: '#fca5a5',
                      fontSize: '13px',
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
                    background: isLoading ? 'rgba(154,107,60,0.5)' : '#9A6B3C',
                    border: 'none',
                    borderRadius: '999px',
                    color: '#F5F0E8',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.background = '#B5834A'
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.currentTarget.style.background = '#9A6B3C'
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Wird verarbeitet...
                    </>
                  ) : (
                    'Anfrage absenden →'
                  )}
                </button>
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
