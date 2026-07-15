/**
 * Pure, client-safe helper for resolving an image src.
 *
 * Uploaded package images live in a PRIVATE storage bucket, so their raw
 * `*.amazonaws.com/<key>` URLs return 403 when loaded directly in the browser.
 * This helper rewrites those URLs to our own `/api/images` proxy route, which
 * streams the object using server-side credentials. Any other URL (e.g. a
 * public CDN link used by seeded sample data, or a local /public asset) is
 * returned unchanged.
 */
export function resolveImageSrc(url?: string | null): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/^https?:\/\/[^/]+\.s3[.-][^/]*\.amazonaws\.com\/(.+)$/i)
  if (match) {
    return `/api/images?key=${encodeURIComponent(match[1])}`
  }
  return trimmed
}
