import { useFetch } from "./useFetch";
import type Game from "../models/game";

const NO_GAMES: Game[] = [];

const useAllGame = () => {
  const { data, loading, error } = useFetch<Game[]>("/api/jeux/");
  return { games: data ?? NO_GAMES, loading, error };
};

export default useAllGame;
