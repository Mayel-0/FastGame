// Adapte si ton .env utilise un autre nom ou contient déjà "/api"
const API_URL = import.meta.env.VITE_API_URL ?? "";

export const DEFAULT_AVATAR = `${API_URL}/api/media/default-avatar.svg`;

/** Transforme le chemin stocké en base (ex. /api/media/avatars/xxx.webp) en URL complète. */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return DEFAULT_AVATAR;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`;
}
