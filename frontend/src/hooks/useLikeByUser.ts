import { useFetch } from "./useFetch";
import type { LikeWithGame } from "../models/likes";

const useLikeByUser = (userId: number | null) =>
  useFetch<LikeWithGame[]>(userId === null ? null : `/api/likes/user/${userId}`);

export default useLikeByUser;
