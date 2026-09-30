import { useFetch } from "./useFetch";
import type { RankedGame } from "../models/community";

export const useWorstRatedGames = (limit = 10) =>
  useFetch<RankedGame[]>(`/api/notes/worst?limit=${limit}`);
