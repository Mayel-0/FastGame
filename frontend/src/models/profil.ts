export default interface Profil {
  id: number;
  created_at?: string | null;
  email?: string;
  username: string;
  bio: string | null;
  image_url: string | null;
}

export interface UserStats {
  ratings_count: number;
  average_rating: number | null;
  likes_count: number;
  public_lists_count: number;
  followers_count: number;
  following_count: number;
  favorite_genre: string | null;
  ratings_distribution: { value: number; count: number }[];
}
