import { API_URL } from "./api";

export const DEFAULT_AVATAR = `${API_URL}/api/media/default-avatar.png`;

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return DEFAULT_AVATAR;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`;
}
