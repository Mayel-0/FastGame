import { useState, type FormEvent } from "react";
import type { Note } from "../models/game";

interface NoteListProps {
  notes: Note[];
  userNote: Note | null;
  averageNote: number | null;
  isAuthenticated: boolean;
  onAddNote: (value: number, body: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
}

const starValues = [1, 2, 3, 4, 5];

function NoteList({
  notes,
  userNote,
  averageNote,
  isAuthenticated,
  onAddNote,
  onDeleteNote,
}: NoteListProps) {
  const [value, setValue] = useState(5);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherNotes = userNote
    ? notes.filter((note) => note.id !== userNote.id)
    : notes;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("Connecte-toi pour laisser une note.");
      return;
    }

    if (userNote) {
      setError("Tu as déjà noté ce jeu. Supprime ta note pour en ajouter une nouvelle.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onAddNote(value, body);
      setBody("");
      setValue(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await onDeleteNote(noteId);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de supprimer la note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="note-list" aria-labelledby="notes-title">
      <div className="note-list__summary">
        <div>
          <span className="note-list__label">Moyenne</span>
          <strong className="note-list__score">{averageNote !== null ? averageNote.toFixed(1) : "—"}</strong>
        </div>
        <div>
          <span className="note-list__label">Notes</span>
          <strong>{notes.length}</strong>
        </div>
      </div>

      {isAuthenticated && !userNote && (
        <form className="note-list__form" onSubmit={handleSubmit}>
          <div className="note-list__form-head">
            <h3 id="notes-title">Donne ton avis</h3>
            <div className="note-list__stars" aria-label="Choisir une note de 1 à 5">
              {starValues.map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`note-list__star ${star <= value ? "note-list__star--active" : ""}`}
                  onClick={() => setValue(star)}
                  aria-label={`Noter ${star} sur 5`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="note-list__field">
            <span>Commentaire</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="Partage ton ressenti sur ce jeu…"
            />
          </label>

          {error && <p className="note-list__error" role="alert">{error}</p>}

          <button className="note-list__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi…" : "Publier ma note"}
          </button>
        </form>
      )}

      {isAuthenticated && userNote && (
        <div className="note-list__user-note">
          <div className="note-list__item-header">
            <h3>Ta note</h3>
            <span className="note-list__badge">{userNote.value}/5</span>
          </div>
          <p className="note-list__value">{Array.from({ length: userNote.value }, () => "★").join("")}</p>
          {userNote.body && <p className="note-list__comment">{userNote.body}</p>}
          <button
            className="note-list__delete"
            type="button"
            onClick={() => handleDelete(userNote.id)}
            disabled={isSubmitting}
          >
            Supprimer ma note
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <p className="note-list__login">Connecte-toi pour partager ton avis et noter ce jeu.</p>
      )}

      <div className="note-list__notes">
        <h3 className="note-list__notes-title">Notes des joueurs</h3>

        {otherNotes.length === 0 ? (
          <p className="note-list__empty">Aucune note pour le moment. Sois le premier à noter ce jeu.</p>
        ) : (
          otherNotes.map((note) => (
            <article key={note.id} className="note-list__item">
              <div className="note-list__item-header">
                <strong>{note.username ?? "Joueur"}</strong>
                <span className="note-list__badge">{note.value}/5</span>
              </div>
              <p className="note-list__value">{Array.from({ length: note.value }, () => "★").join("")}</p>
              {note.body ? <p className="note-list__comment">{note.body}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default NoteList;
