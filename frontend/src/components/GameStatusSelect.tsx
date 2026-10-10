import { useState } from "react";
import type { ChangeEvent } from "react";
import { STATUTS, STATUT_LABELS, type Statut } from "../models/statut";

interface GameStatusSelectProps {
  gameId: number;
  statut: Statut | null;
  error?: string | null;
  onChange: (gameId: number, statut: Statut | null) => Promise<boolean>;
}

function GameStatusSelect({ gameId, statut, error = null, onChange }: GameStatusSelectProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value === "" ? null : (event.target.value as Statut);
    setIsSaving(true);
    try {
      await onChange(gameId, next);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <aside className="game-status" aria-labelledby="game-status-title">
      <p className="game-status__eyebrow">Ma bibliothèque</p>
      <h2 className="game-status__title" id="game-status-title">Où en es-tu ?</h2>
      <label className="game-status__field">
        <span className="u-visually-hidden">Statut du jeu</span>
        <select value={statut ?? ""} onChange={handleChange} disabled={isSaving}>
          <option value="">Pas dans ma bibliothèque</option>
          {STATUTS.map((value) => (
            <option key={value} value={value}>{STATUT_LABELS[value]}</option>
          ))}
        </select>
      </label>
      <p className="game-status__hint">
        {statut ? `Classé dans « ${STATUT_LABELS[statut]} » sur ton profil.` : "Ajoute ce jeu pour le retrouver sur ton profil."}
      </p>
      {error && <p className="game-status__error" role="alert">{error}</p>}
    </aside>
  );
}

export default GameStatusSelect;
