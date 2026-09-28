import type Game from "./game";

export interface Liste {
  id: number;
  users_id: number;
  liste_title: string;
  items_count: number;
  public: boolean;
  created_at?: string | null;
}

export interface ListItem {
  id_item: number;
  id_list: number;
  id_user: number;
}

export interface JoinedListe {
  list_id: number;
  title: string;
  public: boolean;
  created_at: string | null;
  items_count: number;
  games: Game[];
}

export interface ListOption {
  id: number;
  liste_title: string;
}
