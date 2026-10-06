import type Game from "./game";

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
  owner_id: number;
  owner_image_url?: string | null;
  items_count: number;
  preview: string[];
  likes_count?: number;
  liked_by_me?: boolean;
}

export interface LikedList extends PublicList {
  likes_count: number;
  liked_by_me: boolean;
  liked_at: string | null;
}

export interface PublicListDetail {
  list_id: number;
  title: string;
  owner_id: number;
  owner: string;
  owner_image_url?: string | null;
  items_count: number;
  games: Game[];
}

export interface TopUser {
  id: number;
  username: string;
  image_url: string | null;
  public_lists_count: number;
  likes_received: number;
}
