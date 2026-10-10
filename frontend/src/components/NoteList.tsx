import { useState, type FormEvent } from "react";
import { Heart } from "lucide-react";
import type { Note } from "../models/game";
import { useAuth } from "../context/AuthContext";
import UserIdentity from "./UserIdentity";

interface NoteListProps {
  notes: Note[];
  userNote: Note | null;
  averageNote: number | null;
  isAuthenticated: boolean;
  onAddNote: (value: number, body: string) => Promise<void>;
  onUpdateNote: (noteId: number, value: number, body: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
  onToggleNoteLike: (note: Note) => Promise<void>;
}

const starValues = [1, 2, 3, 4, 5];

function NoteList({
  notes,
  userNote,
  averageNote,
  isAuthenticated,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onToggleNoteLike,
}: NoteListProps) {
  const { user } = useAuth();
  const [value, setValue] = useState(5);
  const [body, setBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherNotes = userNote
    ? notes.filter((note) => note.id !== userNote.id)
    : notes;
  const showForm = isAuthenticated && (!userNote || isEditing);

  const resetForm = () => {
    setBody("");
    setValue(5);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("Connecte-toi pour laisser une note.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (userNote) {
        await onUpdateNote(userNote.id, value, body);
      } else {
        await onAddNote(value, body);
      }
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: Note) => {
    setError(null);
    setValue(note.value);
    setBody(note.body ?? "");
    setIsEditing(true);
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

  const handleToggleLike = async (note: Note) => {
    setError(null);

    try {
      await onToggleNoteLike(note);
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : "Impossible de liker cet avis.");
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

      {showForm && (
        <form className="note-list__form" onSubmit={handleSubmit}>
          <div className="note-list__form-head">
            <h3>{isEditing ? "Modifie ton avis" : "Donne ton avis"}</h3>
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
              maxLength={1000}
              placeholder="Partage ton ressenti sur ce jeu…"
            />
          </label>

          <div className="note-list__actions">
            <button className="note-list__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : isEditing ? "Enregistrer" : "Publier ma note"}
            </button>
            {isEditing && (
              <button className="note-list__cancel" type="button" onClick={resetForm} disabled={isSubmitting}>
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      {isAuthenticated && userNote && !isEditing && (
        <div className="note-list__user-note">
          <div className="note-list__item-header">
            <div className="note-list__author">
              {user && <UserIdentity userId={user.id} username={user.username} imageUrl={user.image_url} />}
              <h3>Ta note</h3>
            </div>
            <span className="note-list__badge">{userNote.value}/5</span>
          </div>
          <p className="note-list__value">{"★".repeat(userNote.value)}</p>
          {userNote.body && <p className="note-list__comment">{userNote.body}</p>}
          <span className="note-list__edited">
            {userNote.likes_count} {userNote.likes_count === 1 ? "like" : "likes"}
            {userNote.updated_at ? " · modifiée" : ""}
          </span>
          <div className="note-list__actions">
            <button
              className="note-list__edit"
              type="button"
              onClick={() => handleEdit(userNote)}
              disabled={isSubmitting}
            >
              Modifier ma note
            </button>
            <button
              className="note-list__delete"
              type="button"
              onClick={() => handleDelete(userNote.id)}
              disabled={isSubmitting}
            >
              Supprimer ma note
            </button>
          </div>
        </div>
      )}

      {error && <p className="note-list__error" role="alert">{error}</p>}

      {!isAuthenticated && (
        <p className="note-list__login">Connecte-toi pour partager ton avis et noter ce jeu.</p>
      )}

      <div className="note-list__notes">
        <h3 className="note-list__notes-title" id="notes-title">Notes des joueurs</h3>

        {otherNotes.length === 0 ? (
          <p className="note-list__empty">Aucune note pour le moment. Sois le premier à noter ce jeu.</p>
        ) : (
          otherNotes.map((note) => (
            <article key={note.id} className="note-list__item">
              <div className="note-list__item-header">
                <UserIdentity
                  userId={note.id_user}
                  username={note.username ?? "Joueur"}
                  imageUrl={note.image_url}
                />
                <span className="note-list__badge">{note.value}/5</span>
              </div>
              <p className="note-list__value">{"★".repeat(note.value)}</p>
              {note.body ? <p className="note-list__comment">{note.body}</p> : null}
              <div className="note-list__item-footer">
                <span className="note-list__edited">{note.updated_at ? "Modifiée" : ""}</span>
                <button
                  type="button"
                  className={`note-list__like ${note.liked_by_me ? "note-list__like--active" : ""}`}
                  onClick={() => handleToggleLike(note)}
                  disabled={!isAuthenticated}
                  aria-label={note.liked_by_me ? "Retirer le like de cet avis" : "Liker cet avis"}
                  aria-pressed={note.liked_by_me}
                  title={isAuthenticated ? undefined : "Connecte-toi pour liker un avis"}
                >
                  <Heart size={14} fill={note.liked_by_me ? "currentColor" : "none"} aria-hidden="true" />
                  <span>{note.likes_count}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default NoteList;
