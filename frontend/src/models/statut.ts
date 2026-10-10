import type Game from "./game";

export type Statut = "a_faire" | "en_cours" | "termine" | "abandonne";

export const STATUTS: Statut[] = ["en_cours", "a_faire", "termine", "abandonne"];

export const STATUT_LABELS: Record<Statut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  abandonne: "Abandonné",
};

export interface StatutJeu {
  game_id: number;
  statut: Statut;
  updated_at?: string | null;
}

export interface LibraryGame extends Game {
  statut: Statut;
  updated_at?: string | null;
}
