const MAX_EDGE = 1920
const WEBP_QUALITY = 0.85
const PASSTHROUGH_TYPES = new Set(['image/gif', 'image/svg+xml'])

export async function compressImage(file: File): Promise<File> {
  if (PASSTHROUGH_TYPES.has(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    )
    if (!blob || blob.size >= file.size) return file

    const stem = file.name.replace(/\.[^.]+$/, '') || 'pasted-image'
    return new File([blob], `${stem}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}
