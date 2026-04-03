const steps = [
  {
    num: '1',
    title: 'Mieter meldet den Schaden',
    text: 'Foto, Beschreibung und Ort — alles in einem einfachen Formular. 2 Minuten. Kein Telefonat, keine E-Mail, keine Warteschleife für den Mieter.',
    highlight: false,
  },
  {
    num: '2',
    title: 'CARL analysiert die Meldung — in Sekunden',
    textBlocks: [
      'In dem Moment, in dem die Meldung eingeht, arbeitet CARL automatisch durch alles, was Sie sonst manuell recherchieren müssten:',
      null, // spacer
    ],
    bullets: [
      { label: 'Mietvertrag', detail: 'Wer ist zuständig — Vermieter oder Mieter? Rechtlich begründet nach MRG.' },
      { label: 'Versicherungspolice', detail: 'Ist der Schaden gedeckt? Welche Police greift?' },
      { label: 'Schadensfotos', detail: 'Art und Ausmaß des Schadens — objektiv bewertet, nicht nach Gefühl.' },
      { label: 'Dringlichkeit', detail: 'Notfall, dringend oder planbar — korrekt eingestuft.' },
      { label: 'Werkstatt', detail: 'Welche hinterlegte Werkstatt ist für dieses Gewerk zuständig?' },
      { label: 'Versicherungsformular', detail: 'Wird automatisch ausgefüllt — fertig, nicht nur angelegt.' },
    ],
    callout: 'Was Ihre Mitarbeiterin früher 2–3 Stunden an Telefonaten, E-Mails und Unterlagensuche gekostet hat — liegt jetzt in Sekunden fertig vor ihr.',
    highlight: true,
  },
  {
    num: '3',
    title: 'Ihr Mitarbeiter sieht alles auf einen Blick',
    text: 'CARL liefert: Wer ist verantwortlich (mit rechtlicher Begründung), welche Werkstatt ist zuständig, ob die Versicherung greift — und was als nächstes zu tun ist. Kein Hin- und Herschauen mehr. Kein Zusammensuchen.',
    highlight: false,
  },
  {
    num: '4',
    title: 'Freigabe mit einem Klick',
    text: 'Ein kurzer Blick, ein Klick — die finale Entscheidung liegt bei Ihnen. Danach läuft alles automatisch: Werkstatt erhält den Auftrag, Mieter wird informiert, Fall ist dokumentiert.',
    highlight: false,
  },
  {
    num: '5',
    title: 'Der Handwerker trifft beim Mieter ein',
    text: 'Koordiniert, informiert, mit allen nötigen Angaben ausgestattet. Der gesamte Fall ist lückenlos dokumentiert — ohne manuelle Nacharbeit.',
    highlight: false,
    last: true,
  },
]

export default function ProcessSection() {
  return (
    <section id="ablauf" style={{ background: 'var(--bg-primary)', padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <p className="sw-label" style={{ marginBottom: 20 }}>Der Ablauf</p>

        <h2 style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, color: 'var(--text-primary)', margin: '0 0 16px', fontWeight: 700 }}>
          Von der Meldung bis zur fertigen<br />
          Dokumentation. Fünf Schritte.
        </h2>

        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 64px' }}>
          Was früher über Telefon, E-Mail und Excel koordiniert werden musste,
          läuft jetzt strukturiert durch einen einzigen Kanal — mit einem Klick Ihrer Mitarbeiter.
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, i) => {
            const isLast = i === steps.length - 1
            return (
              <div key={s.num} style={{ display: 'flex', gap: 28, paddingBottom: isLast ? 0 : 48 }}>
                {/* Left: circle + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: s.highlight ? '#C74229' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: s.highlight ? '0 0 0 4px rgba(199,66,41,0.15)' : 'none',
                    flexShrink: 0, zIndex: 1,
                  }}>
                    <span style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{s.num}</span>
                  </div>
                  {/* Connector line — only between steps, never after last */}
                  {!isLast && (
                    <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 6, minHeight: 32 }} />
                  )}
                </div>

                {/* Right: content */}
                <div style={{ paddingTop: 8, flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                    fontSize: s.highlight ? 18 : 16,
                    fontWeight: s.highlight ? 700 : 500,
                    color: s.highlight ? 'var(--text-primary)' : 'var(--text-primary)',
                    margin: '0 0 10px',
                  }}>{s.title}</p>

                  {/* Standard step */}
                  {'text' in s && s.text && (
                    <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                      {s.text}
                    </p>
                  )}

                  {/* CARL highlight step */}
                  {'bullets' in s && s.bullets && (
                    <div style={{
                      background: 'rgba(199,66,41,0.04)',
                      border: '1px solid rgba(199,66,41,0.18)',
                      borderRadius: 10,
                      padding: '20px 24px',
                      marginTop: 4,
                    }}>
                      <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                        In dem Moment, in dem die Meldung eingeht, analysiert CARL automatisch — alles was Sie sonst manuell zusammensuchen müssten:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {s.bullets.map((b) => (
                          <div key={b.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C74229" strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 2 }}>
                              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
                              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{b.label}:</strong>{' '}{b.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* WOW callout */}
                      <div style={{
                        marginTop: 20,
                        padding: '14px 18px',
                        background: '#C74229',
                        borderRadius: 7,
                      }}>
                        <p style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: 14, lineHeight: 1.65, color: '#FFFFFF', margin: 0, fontWeight: 500 }}>
                          💡 Was Ihre Mitarbeiterin früher <strong>2–3 Stunden</strong> an Telefonaten, E-Mails und Unterlagensuche gekostet hat — liegt jetzt in Sekunden fertig vor ihr.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
