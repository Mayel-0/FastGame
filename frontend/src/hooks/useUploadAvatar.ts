import { useCallback, useState } from "react";

// Adapte si ton .env utilise un autre nom ou contient déjà "/api"
const API_URL = import.meta.env.VITE_API_URL ?? "";

// À adapter : récupère le token de la même façon que tes autres hooks (context ou localStorage)
const getToken = () => localStorage.getItem("token");

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.detail ?? `Erreur ${res.status}`;
}

export function useUploadAvatar() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (init: RequestInit): Promise<string | null> => {
      setUploading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/users/me/avatar`, {
          ...init,
          headers: { Authorization: `Bearer ${getToken()}` }, // pas de Content-Type : le navigateur gère le multipart
        });
        if (!res.ok) throw new Error(await readError(res));
        const data = await res.json();
        return data.image_url as string;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  /** Envoie la nouvelle photo. Renvoie la nouvelle URL, ou null en cas d'erreur. */
  const upload = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request({ method: "POST", body: formData });
    },
    [request],
  );

  /** Revient à l'avatar par défaut. */
  const reset = useCallback(() => request({ method: "DELETE" }), [request]);

  return { upload, reset, uploading, error };
}
