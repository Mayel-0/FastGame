import { Link } from "react-router-dom";
import type { RankedGame } from "../models/community";
import { toSlug } from "../utils/slug";

interface CommunityRankingProps {
  title: string;
  eyebrow: string;
  games: RankedGame[] | null;
  metric: "rating" | "likes";
}

export default function CommunityRanking({ title, eyebrow, games, metric }: CommunityRankingProps) {
  return (
    <section className="community-ranking" aria-label={title}>
      <header className="community-ranking__header">
        <p className="community-ranking__eyebrow">{eyebrow}</p>
        <h2 className="community-ranking__title">{title}</h2>
      </header>
      {!games?.length ? (
        <p className="community-ranking__empty">Pas encore de classement disponible.</p>
      ) : (
        <ol className="community-ranking__list">
          {games.map((game, index) => (
            <li className="community-ranking__item" key={game.id}>
              <span className="community-ranking__rank">{String(index + 1).padStart(2, "0")}</span>
              <Link
                className="community-ranking__game"
                to={`/jeux/d/${toSlug(game.titre)}`}
              >
                {game.image ? (
                  <img className="community-ranking__image" src={game.image} alt="" loading="lazy" />
                ) : (
                  <span className="community-ranking__image community-ranking__image--empty" aria-hidden="true">FG</span>
                )}
                <span className="community-ranking__game-copy">
                  <span className="community-ranking__game-title">{game.titre}</span>
                  <span className="community-ranking__score">
                    {metric === "rating"
                      ? `★ ${game.avg_rating?.toFixed(1) ?? "—"} · ${game.ratings_count ?? 0} notes`
                      : `♥ ${game.likes ?? 0} likes`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}