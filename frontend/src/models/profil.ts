export default interface Profil {
  id: number;
  created_at?: string | null;
  email?: string;
  username: string;
  bio: string | null;
  image_url: string | null;
}
