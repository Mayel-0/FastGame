import {useAbonnements} from "../hooks/useAbonnement";
import PageLoader from "../components/pageLoader";
import ListAbonnements from "../components/ListAbonnements";

function AbonnementPage() {
  const { followingDetails, followersDetails, followingMap, loading, toggleFollow} = useAbonnements();
  return (
    <main className="abonnement-page">
      <PageLoader loading={loading}>
        <header className="abonnement-page__hero">
          <p className="abonnement-page__eyebrow">Votre communauté</p>
          <h1 className="abonnement-page__title">Abonnements</h1>
          <p className="abonnement-page__intro">
            Retrouvez les profils que vous suivez et les personnes qui vous suivent.
          </p>
        </header>
        <div className="abonnement-page__content">
          <section className="abonnement-page__section" aria-labelledby="abonnement-following-title">
            <header className="abonnement-page__section-header">
              <div>
                <p className="abonnement-page__section-label">Votre réseau</p>
                <h2 className="abonnement-page__section-title" id="abonnement-following-title">Abonnements</h2>
              </div>
              <span className="abonnement-page__count" aria-label={`${followingDetails.length} abonnements`}>
                {followingDetails.length}
              </span>
            </header>
            <ListAbonnements users={followingDetails} followingMap={followingMap} loading={loading} onToggle={toggleFollow} />
          </section>
          <section className="abonnement-page__section" aria-labelledby="abonnement-followers-title">
            <header className="abonnement-page__section-header">
              <div>
                <p className="abonnement-page__section-label">Votre communauté</p>
                <h2 className="abonnement-page__section-title" id="abonnement-followers-title">Abonnés</h2>
              </div>
              <span className="abonnement-page__count" aria-label={`${followersDetails.length} abonnés`}>
                {followersDetails.length}
              </span>
            </header>
            <ListAbonnements users={followersDetails} followingMap={followingMap} loading={loading} onToggle={toggleFollow} />
          </section>
        </div>
      </PageLoader>
    </main>
  )
}

export default AbonnementPage;
