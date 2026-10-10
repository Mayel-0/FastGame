import { useFetch } from "./useFetch";
import type { UserStats } from "../models/profil";

const useUserStats = (userId: number | null) =>
  useFetch<UserStats>(userId === null ? null : `/api/users/${userId}/stats`);

export default useUserStats;
