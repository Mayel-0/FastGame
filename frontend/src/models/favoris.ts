export interface Favori {
  id: number;
  post_id: number;
  user_id: number;
  update_at?: string | null;
}

export interface FavoriWithGame {
  favori_id: number;
  game_id: number;
  titre: string;
  studio?: string;
  plateforme?: string;
  annee?: number;
  genre?: string;
  image?: string;
  url?: string;
}
