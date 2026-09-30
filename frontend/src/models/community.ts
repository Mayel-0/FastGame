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
  owner_id: number;
  owner: string;
  owner_image_url: string | null;
  items_count: number;
  preview: string[];
}
