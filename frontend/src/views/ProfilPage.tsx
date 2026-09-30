import { useState } from "react";
import UserDetails from "../components/userDetails";
import AvatarUploader from "../components/avatarUpload";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";
import PageLoader from "../components/pageLoader";

function ProfilPage() {
  const { user: currentUser, isLoading: loadingCurrentUser } = useAuth();
  const { user, loading: loadingUser } = useUserById(currentUser?.id ?? null);

  // Nouvelle URL d'avatar après un upload (évite de recharger toute la page)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isLoading = [loadingCurrentUser, loadingUser].some(Boolean);

  return (
    <PageLoader loading={isLoading}>
      {!isLoading && (!currentUser || !user) ? (
        <main className="profile-details">
          <p role="alert">Profil introuvable.</p>
        </main>
      ) : !isLoading && currentUser && user ? (
        <>
          <AvatarUploader
            imageUrl={avatarUrl ?? user.image_url}
            onChange={setAvatarUrl}
          />
          <UserDetails
            profil={{ ...user, image_url: avatarUrl ?? user.image_url }}
            currentUser={currentUser}
          />
        </>
      ) : null}
    </PageLoader>
  );
}

export default ProfilPage;
