import { useLocation, useParams } from "react-router-dom";
import GameDetailsCard from "../components/gameDetailsCard";
import NoteList from "../components/NoteList";
import { useAuth } from "../context/AuthContext";
import useGameDetails from "../hooks/useGameDetails";
import type Game from "../models/game";
import PageLoader from "../components/pageLoader";

function PageDetailsgame() {
  const { slug } = useParams();
  const { state } = useLocation();
  const { isAuthenticated } = useAuth();

  const initialGame = (state as { game?: Game } | null)?.game ?? null;
  const {
    game,
    notes,
    averageNote,
    userNote,
    loading,
    error,
    addNote,
    deleteNote,
  } = useGameDetails(slug, initialGame);

  if (!game && !loading && !error) {
    return (
      <main className="details-page__state">
        <h2>Erreur dans le chargement du jeu</h2>
      </main>
    );
  }

  return (
    <PageLoader loading={loading}>
      {error || !game ? (
        <main className="details-page__state">
          <h2>Le jeu demandé est introuvable.</h2>
          <p>{error ?? "Aucune fiche n’a été trouvée."}</p>
        </main>
      ) : (
        <main className="details-page">
          <section className="details-page__header">
            <GameDetailsCard game={game} noteAverage={averageNote} notesCount={notes.length} />
          </section>

          <NoteList
            notes={notes}
            userNote={userNote}
            averageNote={averageNote}
            isAuthenticated={isAuthenticated}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
          />
        </main>
      )}
    </PageLoader>
  );
}

export default PageDetailsgame;
