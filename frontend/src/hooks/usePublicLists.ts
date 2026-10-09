import { useEffect, useState } from "react";
import type { PublicList } from "../models/community";
import { API_URL } from "../utils/api";

const PAGE_SIZE = 50;

export function usePublicLists() {
  const [query, setQuery] = useState("");
  const [lists, setLists] = useState<PublicList[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const term = query.trim();

    if (term.length === 1) {
      setLists([]);
      setHasMore(false);
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError(null);
    const timeout = window.setTimeout(
      () => {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (term.length >= 2) params.set("q", term);

        fetch(`${API_URL}/api/lists/public/search?${params}`, {
          signal: controller.signal,
        })
          .then((response) => {
            if (!response.ok) throw new Error(`Erreur ${response.status}`);
            return response.json() as Promise<PublicList[]>;
          })
          .then((page) => {
            setLists((current) =>
              offset === 0 ? page : [...current, ...page],
            );
            setHasMore(page.length === PAGE_SIZE);
          })
          .catch((requestError: Error) => {
            if (requestError.name !== "AbortError")
              setError(requestError.message);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      offset === 0 ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, offset]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setOffset(0);
    setLists([]);
  };

  const loadMore = () => setOffset(lists.length);

  return {
    data: lists,
    loading,
    error,
    query,
    setQuery: updateQuery,
    hasMore,
    loadMore,
  };
}
