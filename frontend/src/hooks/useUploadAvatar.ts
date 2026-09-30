import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Même valeur par défaut que dans AuthContext
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return typeof body?.detail === "string"
    ? body.detail
    : `Erreur ${res.status}`;
}

export function useUploadAvatar() {
  // authFetch ajoute déjà le header Authorization et déconnecte l'utilisateur sur un 401
  const { authFetch, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (init: RequestInit): Promise<string | null> => {
      setUploading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/api/users/me/avatar`, init);
        if (!res.ok) throw new Error(await readError(res));

        const data = await res.json();
        // Met à jour l'utilisateur du contexte (navbar, etc.) avec la nouvelle image
        void refreshProfile();
        return data.image_url as string;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [authFetch, refreshProfile],
  );

  /** Envoie la nouvelle photo. Renvoie la nouvelle URL, ou null en cas d'erreur. */
  const upload = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("file", file); // pas de Content-Type : le navigateur gère le multipart
      return request({ method: "POST", body: formData });
    },
    [request],
  );

  /** Revient à l'avatar par défaut. */
  const reset = useCallback(() => request({ method: "DELETE" }), [request]);

  return { upload, reset, uploading, error };
}
