import { useFetch } from "./useFetch";
import type { RankedGame } from "../models/community";

export const useMostLikedGames = (limit = 10) =>
  useFetch<RankedGame[]>(`/api/likes/top?limit=${limit}`);
