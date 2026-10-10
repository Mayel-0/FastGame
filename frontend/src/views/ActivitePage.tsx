import { Link } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import PageLoader from "../components/pageLoader";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../hooks/useActivity";

function ActivitePage() {
  const { isAuthenticated, isLoading: loadingUser } = useAuth();
  const { activities, loading, error, hasMore, loadMore } = useActivity();

  const isFirstLoad = loadingUser || (loading && activities.length === 0);

  return (
    <main className="activity-page">
      <PageLoader loading={isFirstLoad}>
        <header className="activity-page__hero">
          <p className="activity-page__eyebrow">Vos abonnements</p>
          <h1 className="activity-page__title">Fil d'actualité</h1>
          <p className="activity-page__intro">
            Les dernières notes, les coups de cœur et les nouvelles listes des joueurs que vous suivez.
          </p>
        </header>
        <div className="activity-page__content">
          {!isAuthenticated ? (
            <p className="activity-page__message">
              <Link to="/login">Connectez-vous</Link> pour suivre l'activité de vos abonnements.
            </p>
          ) : error ? (
            <p className="activity-page__message" role="alert">Le fil d'actualité n'a pas pu être chargé.</p>
          ) : activities.length === 0 ? (
            <p className="activity-page__message">
              Rien à afficher pour le moment. Abonnez-vous à des joueurs depuis la page{" "}
              <Link to="/commu">Communauté</Link> pour remplir votre fil.
            </p>
          ) : (
            <>
              <ActivityFeed activities={activities} />
              {hasMore && (
                <button className="activity-page__load-more" type="button" onClick={loadMore} disabled={loading}>
                  {loading ? "Chargement…" : "Voir plus d'activité"}
                </button>
              )}
            </>
          )}
        </div>
      </PageLoader>
    </main>
  );
}

export default ActivitePage;
