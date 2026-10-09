export interface Favori {
  id: number;
  post_id: number;
  user_id: number;
  update_at?: string | null;
}

export interface FavoriWithGame {
  favori_id: number;
  game_id: number;
  titre: string | null;
  studio: string | null;
  plateforme: string | null;
  annee: string | null;
  genre: string | null;
  image: string | null;
  url: string | null;
}
