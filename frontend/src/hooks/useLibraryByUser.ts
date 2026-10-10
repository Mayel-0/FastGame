import { useFetch } from "./useFetch";
import type { LibraryGame } from "../models/statut";

const useLibraryByUser = (userId: number | null) =>
  useFetch<LibraryGame[]>(userId === null ? null : `/api/statuts/user/${userId}`);

export default useLibraryByUser;
