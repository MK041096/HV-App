// Direkter Lib-Import + Warmup-Retry: umgeht einen pdf-parse v1.1.1 Bug,
// bei dem die ersten 1-2 Aufrufe in einem frischen Node-Prozess (Vercel-Cold-Start)
// mit "Illegal character: 41" oder "bad XRef entry" fehlschlagen.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawPdfParse = require('pdf-parse/lib/pdf-parse.js')

export async function pdfParse(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  try {
    return await rawPdfParse(buffer)
  } catch (firstErr) {
    try {
      return await rawPdfParse(buffer)
    } catch {
      throw firstErr
    }
  }
}
