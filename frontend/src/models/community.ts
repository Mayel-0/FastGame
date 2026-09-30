export interface RankedGame {
  id: number;
  titre: string;
  image: string | null;
  avg_rating?: number;
  ratings_count?: number;
  likes?: number;
}

export interface PublicList {
  list_id: number;
  title: string;
  owner: string;
  items_count: number;
  preview: string[];
}
