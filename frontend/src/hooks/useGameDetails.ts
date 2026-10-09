import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type Game from "../models/game";
import type { GameDetailsPayload, Note } from "../models/game";
import { toSlug } from "../utils/slug";
import { API_URL } from "../utils/api";

export default function useGameDetails(slug?: string, initialGame?: Game | null) {
  const { authFetch, token } = useAuth();
  const [game, setGame] = useState<Game | null>(initialGame ?? null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [averageNote, setAverageNote] = useState<number | null>(null);
  const [userNote, setUserNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshGame = useCallback(async (resolvedGame: Game | null) => {
    if (!resolvedGame) {
      setNotes([]);
      setAverageNote(null);
      setUserNote(null);
      return;
    }

    const response = await fetch(
      `${API_URL}/api/notes/game/${resolvedGame.id}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
    if (!response.ok) {
      throw new Error("Impossible de récupérer les notes du jeu.");
    }

    const payload = (await response.json()) as GameDetailsPayload;
    setGame(payload.game ?? resolvedGame);
    setNotes(payload.notes ?? []);
    setAverageNote(payload.average_note ?? payload.game?.note_moyenne ?? null);
    setUserNote(payload.user_note ?? null);
  }, [token]);

  useEffect(() => {
    let isActive = true;

    const loadGameDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        let resolvedGame = initialGame ?? null;

        if (!resolvedGame && slug) {
          const response = await fetch(`${API_URL}/api/jeux/`);
          if (!response.ok) {
            throw new Error("Erreur lors du chargement du jeu.");
          }

          const games = (await response.json()) as Game[];
          resolvedGame = games.find((entry) => toSlug(entry.titre ?? "") === slug) ?? null;
        }

        if (!resolvedGame) {
          if (!isActive) return;
          setGame(null);
          setError("Aucun jeu trouvé pour cette fiche.");
          setNotes([]);
          setAverageNote(null);
          setUserNote(null);
          return;
        }

        if (!isActive) return;
        setGame(resolvedGame);
        await refreshGame(resolvedGame);
      } catch (loadError) {
        if (!isActive) return;
        setError(loadError instanceof Error ? loadError.message : "Erreur inconnue.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadGameDetails();

    return () => {
      isActive = false;
    };
  }, [initialGame, refreshGame, slug]);

  const addNote = useCallback(async (value: number, body: string) => {
    if (!game) {
      throw new Error("Aucun jeu sélectionné.");
    }

    const response = await authFetch(`${API_URL}/api/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_game: game.id,
        value,
        body: body.trim() || null,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.detail ?? "Impossible d’ajouter la note.");
    }

    await refreshGame(game);
  }, [authFetch, game, refreshGame]);

  const deleteNote = useCallback(async (noteId: number) => {
    if (!game) {
      return;
    }

    const response = await authFetch(`${API_URL}/api/notes/${noteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.detail ?? "Impossible de supprimer la note.");
    }

    await refreshGame(game);
  }, [authFetch, game, refreshGame]);

  return {
    game,
    notes,
    averageNote,
    userNote,
    loading,
    error,
    addNote,
    deleteNote,
  };
}
