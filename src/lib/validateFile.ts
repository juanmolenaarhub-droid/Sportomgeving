const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_MB = 5

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Alleen JPG, PNG, WebP en GIF bestanden zijn toegestaan.'
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Bestand mag maximaal ${MAX_FILE_SIZE_MB}MB zijn.`
  }
  return null
}
