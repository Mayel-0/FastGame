export default interface Game {
  id: number;
  titre: string | null;
  studio: string | null;
  plateforme: string | null;
  annee: string | null;
  genre: string | null;
  image: string | null;
  url: string | null;
  note?: number | null;
  note_moyenne?: number | null;
}

export interface Note {
  id: number;
  id_game: number;
  id_user: number;
  username?: string | null;
  value: number;
  body?: string | null;
}

export interface GameDetailsPayload {
  game: Game;
  average_note: number | null;
  notes: Note[];
  user_note: Note | null;
}
