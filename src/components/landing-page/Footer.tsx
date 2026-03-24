import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#09090f] border-t border-white/[0.05] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <span className="font-playfair text-lg font-bold text-white">
              zerodamage<span className="text-[#c9a44c]">.</span>de
            </span>
            <p className="mt-2 text-[#5a5a70] text-sm max-w-xs leading-relaxed">
              Automatisierte Schadensmeldung für Hausverwaltungen. Österreich.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 text-sm">
            <div className="space-y-2">
              <p className="text-[#c9a44c] text-xs tracking-widest uppercase mb-3">Portal</p>
              <Link href="/login" className="block text-[#6a6a7a] hover:text-white transition-colors">Login</Link>
              <Link href="/hv-registrierung" className="block text-[#6a6a7a] hover:text-white transition-colors">Registrierung</Link>
            </div>
            <div className="space-y-2">
              <p className="text-[#c9a44c] text-xs tracking-widest uppercase mb-3">Rechtliches</p>
              <Link href="/impressum" className="block text-[#6a6a7a] hover:text-white transition-colors">Impressum</Link>
              <Link href="/datenschutz" className="block text-[#6a6a7a] hover:text-white transition-colors">Datenschutz</Link>
              <Link href="/kontakt" className="block text-[#6a6a7a] hover:text-white transition-colors">Kontakt</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[#4a4a5a] text-xs">© 2026 zerodamage.de · Mathias Kracher · Oberwart, Österreich</p>
          <p className="text-[#3a3a4a] text-xs">DSGVO-konform · EU-Server (Stockholm)</p>
        </div>
      </div>
    </footer>
  )
}
