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
  image_url?: string | null;
  value: number;
  body?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  likes_count: number;
  liked_by_me: boolean;
}

export interface GameDetailsPayload {
  game: Game;
  average_note: number | null;
  notes: Note[];
  user_note: Note | null;
}

export interface RecommendedGame extends Game {
  raison: string;
}
