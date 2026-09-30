import { useTopRatedGames } from "../hooks/useTopRatedGames";
import { useWorstRatedGames } from "../hooks/useWorstRatedGames";
import PageLoader from "../components/pageLoader";
import { useRandomPublicLists } from "../hooks/useRandomPublicLists";
import { useMostLikedGames } from "../hooks/useMostLikedGames";
import CommunityRanking from "../components/CommunityRanking";
import CommunityPublicLists from "../components/CommunityPublicLists";

function CommuPage() {
  const { data: topGames, loading: loadingTopGames, error: topGamesError } = useTopRatedGames(5);
  const { data: worstGames, loading: loadingWorstGames, error: worstGamesError } = useWorstRatedGames(5);
  const { data: publicLists, loading: loadingPublicLists, error: publicListsError } = useRandomPublicLists(8);
  const { data: mostLikedGames, loading: loadingMostLikedGames, error: mostLikedGamesError } = useMostLikedGames(5);

  const isLoading = [loadingTopGames, loadingWorstGames, loadingPublicLists, loadingMostLikedGames].some(Boolean);
  const errors = [topGamesError, worstGamesError, publicListsError, mostLikedGamesError].filter(Boolean);

  return (
    <main className="community-page">
      <PageLoader loading={isLoading}>
        <section className="community-page__hero">
          <div className="community-page__hero-inner">
            <p className="community-page__eyebrow">FastGame · joueurs et découvertes</p>
            <h1 className="community-page__title">La communauté</h1>
            <p className="community-page__intro">
              Les jeux qui font parler, les favoris des joueurs et des listes publiques à explorer.
            </p>
          </div>
        </section>

        <div className="community-page__content">
          {errors.length > 0 && (
            <p className="community-page__error" role="alert">
              Certaines données de la communauté n’ont pas pu être chargées.
            </p>
          )}
          <div className="community-page__rankings">
            <CommunityRanking title="Les mieux notés" eyebrow="Le classement" games={topGames} metric="rating" />
            <CommunityRanking title="Les plus aimés" eyebrow="Plébiscités" games={mostLikedGames} metric="likes" />
            <CommunityRanking title="À débattre" eyebrow="Les moins notés" games={worstGames} metric="rating" />
          </div>
          <CommunityPublicLists lists={publicLists} />
        </div>
      </PageLoader>
    </main>
  );
}

export default CommuPage;
