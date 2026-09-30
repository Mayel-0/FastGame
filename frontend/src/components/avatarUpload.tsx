import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useUploadAvatar } from "../hooks/useUploadAvatar";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  onChange: (newUrl: string) => void;
}

export default function AvatarUploader({ onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { upload, reset, uploading, error } = useUploadAvatar();

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError("Image trop lourde (2 Mo maximum).");
      return;
    }

    setLocalError(null);
    const newUrl = await upload(file);
    if (newUrl) onChange(newUrl);
  };

  const handleReset = async () => {
    setLocalError(null);
    const newUrl = await reset();
    if (newUrl) onChange(newUrl);
  };

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__actions">
        <button className="avatar-uploader__button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Envoi…" : "Changer la photo"}
        </button>
        <button className="avatar-uploader__button avatar-uploader__button--secondary" type="button" onClick={handleReset} disabled={uploading}>
          Réinitialiser
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFile}
          hidden
        />
        {(localError || error) && <p className="avatar-uploader__error" role="alert">{localError ?? error}</p>}
      </div>
    </div>
  );
}
