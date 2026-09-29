export interface RankedGame {
  id: number;
  titre: string;
  image: string | null;
  avg_rating?: number;
  ratings_count?: number;
  likes?: number;
}

export interface PublicList {
  id: number;
  name: string;
  owner: string;
  games_count: number;
  preview: string[];
}
