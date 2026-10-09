import { useFetch } from "./useFetch";
import type { PublicList } from "../models/community";

const usePublicListsByUser = (userId: number | null) =>
  useFetch<PublicList[]>(userId === null ? null : `/api/lists/user/${userId}`);

export default usePublicListsByUser;
