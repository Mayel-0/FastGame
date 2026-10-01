import {useAbonnements} from "../hooks/useAbonnement";
import PageLoader from "../components/pageLoader";
import ListAbonnements from "../components/ListAbonnements";

function AbonnementPage() {
  const { followingDetails, followersDetails, loading} = useAbonnements();
  return (
    <main>
      <PageLoader loading={loading}>
        <h1>Abonnements</h1>
        <ListAbonnements users={followingDetails} />
        <h1>Abonnés</h1>
        <ListAbonnements users={followersDetails} />
      </PageLoader>
    </main>
  )
}

export default AbonnementPage;
