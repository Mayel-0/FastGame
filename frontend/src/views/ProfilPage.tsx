import { useParams } from "react-router-dom";
import UserDetails from "../components/userDetails";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";
import PageLoader from "../components/pageLoader";

function ProfilPage() {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const { user: currentUser, isLoading: loadingCurrentUser } = useAuth();
  const parsedUserId = routeUserId ? Number(routeUserId) : currentUser?.id ?? null;
  const isValidUserId = parsedUserId === null || (Number.isInteger(parsedUserId) && parsedUserId > 0);
  const { user, loading: loadingUser, error } = useUserById(isValidUserId ? parsedUserId : null);

  const isLoading = loadingUser || (!routeUserId && loadingCurrentUser);

  return (
    <PageLoader loading={isLoading}>
      {!isLoading && (!isValidUserId || !user) ? (
        <main className="profile-details">
          <p role="alert">{error ?? "Profil introuvable."}</p>
        </main>
      ) : !isLoading && user ? (
        <UserDetails profil={user} currentUser={currentUser} />
      ) : null}
    </PageLoader>
  );
}

export default ProfilPage;
