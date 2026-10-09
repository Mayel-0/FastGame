import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../utils/api";

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return typeof body?.detail === "string"
    ? body.detail
    : `Erreur ${res.status}`;
}

export function useUploadAvatar() {
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

  const upload = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request({ method: "POST", body: formData });
    },
    [request],
  );

  const reset = useCallback(() => request({ method: "DELETE" }), [request]);

  return { upload, reset, uploading, error };
}
