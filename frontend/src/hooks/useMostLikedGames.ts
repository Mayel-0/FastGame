import { useFetch } from "./useFetch";
import type { RankedGame } from "../models/community";

export const useMostLikedGames = (limit = 10) =>
  useFetch<RankedGame[]>(`/likes/top?limit=${limit}`);
