export default interface Like {
  id: number;
  user_id: number;
  game_id: number;
  created_at: string;
}

export default interface LikeWithGame {
  id: number;
  user_id: number;
  game_id: number;
  created_at: string;
  titre: string | null;
  studio: string | null;
  plateforme: string | null;
  annee: string | null;
  genre: string | null;
  image: string | null;
  url: string | null;
}
