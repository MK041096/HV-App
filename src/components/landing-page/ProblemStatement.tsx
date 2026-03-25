import { Reveal } from './Reveal'

export default function ProblemStatement() {
  return (
    <section className="bg-[#f5f0e8] py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.2] text-[#1a1208]">
            Über 80 % aller Schadensmeldungen in Österreich laufen noch über
            Telefon, E-Mail und Zettelwirtschaft.{' '}
            <span style={{ color: '#b85c0a' }}>SchadensMelder ändert das.</span>
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: '3 min', label: 'statt 20 Minuten pro Meldung' },
              { num: '100 %', label: 'Nachverfolgung in Echtzeit' },
              { num: '0 €', label: 'Rückbuchungsrisiko' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <span className="font-playfair text-4xl font-bold" style={{ color: '#b85c0a' }}>
                  {item.num}
                </span>
                <span className="text-sm text-[#6b5c42] leading-snug">{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
