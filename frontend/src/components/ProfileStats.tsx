import type { UserStats } from "../models/profil";

interface ProfileStatsProps {
  stats: UserStats;
}

function ProfileStats({ stats }: ProfileStatsProps) {
  const maxCount = Math.max(1, ...stats.ratings_distribution.map((entry) => entry.count));
  const tiles = [
    { label: "Jeux notés", value: stats.ratings_count },
    { label: "Note moyenne", value: stats.average_rating !== null ? stats.average_rating.toFixed(1) : "—" },
    { label: "Jeux aimés", value: stats.likes_count },
    { label: "Listes publiques", value: stats.public_lists_count },
    { label: "Abonnés", value: stats.followers_count },
    { label: "Abonnements", value: stats.following_count },
  ];

  return (
    <section className="profile-page__games profile-stats" aria-labelledby="profile-stats-title">
      <header className="profile-page__section-header">
        <p className="profile-page__eyebrow">En chiffres</p>
        <h2 className="profile-page__section-title" id="profile-stats-title">Statistiques</h2>
      </header>

      <dl className="profile-stats__tiles">
        {tiles.map((tile) => (
          <div className="profile-stats__tile" key={tile.label}>
            <dt>{tile.label}</dt>
            <dd>{tile.value}</dd>
          </div>
        ))}
      </dl>

      <div className="profile-stats__details">
        <div className="profile-stats__panel">
          <h3 className="profile-stats__panel-title">Répartition des notes</h3>
          {stats.ratings_count === 0 ? (
            <p className="profile-stats__empty">Aucune note pour le moment.</p>
          ) : (
            <ul className="profile-stats__bars">
              {stats.ratings_distribution.map((entry) => (
                <li className="profile-stats__bar-row" key={entry.value}>
                  <span className="profile-stats__bar-label">{entry.value} ★</span>
                  <span className="profile-stats__bar-track" aria-hidden="true">
                    <span
                      className="profile-stats__bar-fill"
                      style={{ width: `${(entry.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="profile-stats__bar-count">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="profile-stats__panel">
          <h3 className="profile-stats__panel-title">Genre préféré</h3>
          <p className="profile-stats__genre">{stats.favorite_genre ?? "—"}</p>
          <p className="profile-stats__empty">D'après les jeux aimés et les mieux notés.</p>
        </div>
      </div>
    </section>
  );
}

export default ProfileStats;
