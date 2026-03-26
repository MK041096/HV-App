'use client'

export default function PendingApprovalScreen() {
  function handleLogout() {
    window.location.href = '/api/auth/logout'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #0E0C09)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
        }}
      >
        {/* House Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 28px',
            background: 'rgba(154,107,60,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B5834A"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif, Georgia, serif)',
            fontSize: '32px',
            fontWeight: 400,
            color: 'var(--text-primary, #F5F0E8)',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          Ihr Zugang wird geprüft
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary, #A09488)',
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}
        >
          Ihre Registrierung ist eingegangen. Wir prüfen Ihre Anfrage und schalten Ihren Zugang innerhalb von 24 Stunden frei. Sie erhalten eine E-Mail-Benachrichtigung.
        </p>

        {/* Progress Steps */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '28px',
          }}
        >
          {/* Step 1 — done */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.2)',
                border: '1px solid rgba(34,197,94,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: 500 }}>
              Registrierung eingegangen
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 0 0 13px' }} />

          {/* Step 2 — active */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(154,107,60,0.2)',
                border: '1px solid rgba(154,107,60,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5834A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pendingSpin 2s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', color: '#B5834A', fontWeight: 500 }}>
              Prüfung läuft
            </span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 0 0 13px' }} />

          {/* Step 3 — pending */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary, #A09488)' }}>
              Zugang freigeschaltet
            </span>
          </div>
        </div>

        {/* Contact */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #A09488)', marginBottom: '20px' }}>
          Bei Fragen:{' '}
          <a
            href="mailto:Kracherdigital@gmail.com"
            style={{ color: '#B5834A', textDecoration: 'underline' }}
          >
            Kracherdigital@gmail.com
          </a>
        </p>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px',
            color: 'var(--text-secondary, #A09488)',
            fontSize: '14px',
            padding: '10px 24px',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = '#F5F0E8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#A09488'
          }}
        >
          Abmelden
        </button>
      </div>

      <style>{`
        @keyframes pendingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
