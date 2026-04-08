/**
 * Derives contractor specialties from free-text Tätigkeit + Beschreibung fields.
 * Used on every insert/update so the DB always has correct specialty codes
 * for automatic workshop matching on damage reports.
 */
export function deriveSpecialties(taetigkeit: string, beschreibung = ''): string[] {
  const text = (taetigkeit + ' ' + beschreibung).toLowerCase()
  const specialties: string[] = []

  if (
    text.includes('wasser') || text.includes('sanitär') ||
    text.includes('rohrbruch') || text.includes('leitungswasser') ||
    text.includes('kanal') || text.includes('abwasser')
  ) specialties.push('wasser')

  if (
    text.includes('heizung') || text.includes('therme') ||
    text.includes('heizkörper') || text.includes('heiztherme') ||
    text.includes('lüftung') || text.includes('klima')
  ) specialties.push('heizung')

  if (
    text.includes('elektrik') || text.includes('elektrisch') ||
    text.includes('strom') || text.includes('licht') ||
    text.includes('schaltanlage')
  ) specialties.push('elektrik')

  if (
    text.includes('fenster') || text.includes('tür') ||
    text.includes('türen') || text.includes('schloss') ||
    text.includes('schlosserei') || text.includes('beschlag') ||
    text.includes('aufzug') || text.includes('lift')
  ) specialties.push('fenster_tueren')

  if (
    text.includes('boden') || text.includes('fliesen') ||
    text.includes('parkett') || text.includes('estrich') ||
    text.includes('maler') || text.includes('malerei') ||
    text.includes('verputz') || text.includes('wand')
  ) specialties.push('boeden')

  if (text.includes('schimmel')) specialties.push('schimmel')

  if (
    text.includes('außen') || text.includes('aussen') ||
    text.includes('garten') || text.includes('fassade') ||
    text.includes('dach') || text.includes('dachdecker') ||
    text.includes('grünanlage')
  ) specialties.push('aussenbereich')

  if (specialties.length === 0) specialties.push('allgemein')

  return specialties
}
