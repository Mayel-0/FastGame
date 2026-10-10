export interface Activity {
  type: "note" | "like" | "liste";
  created_at: string;
  user: {
    id: number;
    username: string;
    image_url: string | null;
  };
  game: {
    id: number;
    titre: string | null;
    image: string | null;
  } | null;
  liste: {
    id: number;
    title: string;
    items_count: number;
  } | null;
  note_value: number | null;
  note_body: string | null;
}
