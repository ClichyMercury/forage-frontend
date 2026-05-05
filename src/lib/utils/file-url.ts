/**
 * Construit l'URL complète d'un fichier servi par le backend.
 * Gère local et prod via VITE_BACKEND_URL.
 *
 * @param path - Chemin relatif stocké en base (ex: "uploads/avatars/xxx.jpg")
 * @returns URL complète ou null si path est vide
 */
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ??
  (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3333/api/v1').replace('/api/v1', '')

export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${BACKEND_URL}/${path}`
}
