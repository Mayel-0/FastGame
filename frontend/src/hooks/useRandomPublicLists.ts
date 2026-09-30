import { useFetch } from "./useFetch";
import type { PublicList } from "../models/community";

export const useRandomPublicLists = (limit = 6) =>
  useFetch<PublicList[]>(`/api/lists/public/random?limit=${limit}`);
