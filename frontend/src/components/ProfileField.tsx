import { useEffect, useState } from "react";

interface ProfileFieldProps {
  label: string;
  value: string;
  type?: "text" | "email" | "password" | "textarea";
  editable: boolean;
  onSave: (value: string) => Promise<void>;
}

function ProfileField({ label, value, type = "text", editable, onSave }: ProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [isEditing, value]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible de sauvegarder.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!editable) {
    return (
      <div className="profile-field">
        <span className="profile-field__label">{label}</span>
        <span className="profile-field__value">{type === "password" ? "••••••••" : value || "Non renseigné"}</span>
      </div>
    );
  }

  return (
    <div className="profile-field">
      <label className="profile-field__label" htmlFor={`profile-${label}`}>
        {label}
      </label>
      {isEditing ? (
        <div className="profile-field__editor">
          {type === "textarea" ? (
            <textarea id={`profile-${label}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} />
          ) : (
            <input id={`profile-${label}`} type={type} value={draft} onChange={(event) => setDraft(event.target.value)} />
          )}
          <div className="profile-field__actions">
            <button type="button" onClick={handleSave} disabled={isSaving || !draft.trim()}>
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
            <button type="button" onClick={() => { setDraft(value); setIsEditing(false); }} disabled={isSaving}>
              Annuler
            </button>
          </div>
          {error && <p className="profile-field__error" role="alert">{error}</p>}
        </div>
      ) : (
        <div className="profile-field__display">
          <span className="profile-field__value">{type === "password" ? "••••••••" : value || "Non renseigné"}</span>
          <button type="button" onClick={() => setIsEditing(true)}>Modifier</button>
        </div>
      )}
    </div>
  );
}

export default ProfileField;
