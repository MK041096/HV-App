import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2026 SchadensMelder</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/impressum" className="text-sm text-gray-500 hover:text-gray-700">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-sm text-gray-500 hover:text-gray-700">
              Datenschutz
            </Link>
            <Link href="/kontakt" className="text-sm text-gray-500 hover:text-gray-700">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
