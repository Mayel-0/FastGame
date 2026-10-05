import { useFetch } from "./useFetch";
import type { TopUser } from "../models/community";

export const useTopUsers = (limit = 10) =>
  useFetch<TopUser[]>(`/api/users/top?limit=${limit}`);
