// EXIF stripping utility for DSGVO compliance (Art. 5 DSGVO - Datensparsamkeit)
// Removes GPS coordinates, device info, and all other EXIF metadata from uploaded photos.
import sharp from 'sharp'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number]

export interface ProcessedImage {
  buffer: Buffer
  mimeType: AllowedMimeType
  width: number
  height: number
  size: number
}

/**
 * Validates and strips EXIF data from an uploaded image buffer.
 * Converts HEIC to JPEG for broader compatibility.
 * Returns a clean buffer with no metadata.
 */
export async function stripExifAndValidate(
  buffer: Buffer,
  originalMimeType: string
): Promise<ProcessedImage> {
  // Validate mime type
  if (!ALLOWED_MIME_TYPES.includes(originalMimeType as AllowedMimeType)) {
    throw new Error(
      `Ungültiger Dateityp: ${originalMimeType}. Erlaubt sind: JPG, PNG, HEIC`
    )
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Datei ist zu gross (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maximum: 10 MB`
    )
  }

  // Process with sharp: strip all metadata, convert HEIC to JPEG
  let pipeline = sharp(buffer, { failOn: 'error' })
    .rotate() // Auto-rotate based on EXIF orientation before stripping
    .withMetadata({ orientation: undefined }) // Remove all EXIF/metadata

  const metadata = await sharp(buffer).metadata()

  let outputMimeType: AllowedMimeType = originalMimeType as AllowedMimeType

  // Convert HEIC to JPEG (wider browser/viewer support)
  if (originalMimeType === 'image/heic') {
    pipeline = pipeline.jpeg({ quality: 85 })
    outputMimeType = 'image/jpeg'
  } else if (originalMimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality: 90 })
  } else if (originalMimeType === 'image/png') {
    pipeline = pipeline.png()
  }

  const outputBuffer = await pipeline.toBuffer()

  return {
    buffer: outputBuffer,
    mimeType: outputMimeType,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: outputBuffer.length,
  }
}

/**
 * Returns the file extension for a given mime type.
 */
export function getExtensionForMimeType(mimeType: AllowedMimeType): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/heic':
      return 'jpg' // HEIC gets converted to JPEG
    default:
      return 'jpg'
  }
}
