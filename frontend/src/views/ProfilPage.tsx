import UserDetails from "../components/userDetails";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";
import PageLoader from "../components/pageLoader";

function ProfilPage() {
  const { user: currentUser, isLoading: loadingCurrentUser } = useAuth();
  const { user, loading: loadingUser } = useUserById(currentUser?.id ?? null);

  const isLoading = [loadingCurrentUser, loadingUser].some(Boolean);

  return (
    <PageLoader loading={isLoading}>
      {!isLoading && (!currentUser || !user) ? (
        <main className="profile-details">
          <p role="alert">Profil introuvable.</p>
        </main>
      ) : !isLoading && currentUser && user ? (
        <UserDetails profil={user} currentUser={currentUser} />
      ) : null}
    </PageLoader>
  );
}

export default ProfilPage;
