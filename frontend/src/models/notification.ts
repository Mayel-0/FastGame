export interface Notification {
  id: number;
  type: "abonnement" | "like_liste" | "like_note";
  lue: boolean;
  created_at: string;
  actor: {
    id: number;
    username: string;
    image_url: string | null;
  };
  liste: {
    id: number;
    title: string;
  } | null;
  game: {
    id: number;
    titre: string | null;
  } | null;
}
