import { useFetch } from "./useFetch";
import type { RankedGame } from "../models/community";

export const useTopRatedGames = (limit = 10) =>
  useFetch<RankedGame[]>(`/api/notes/top?limit=${limit}`);
