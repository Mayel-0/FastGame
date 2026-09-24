import UserDetails from "../components/userDetails";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";

function ProfilPage() {
  const { user: currentUser } = useAuth();
  const { user } = useUserById(currentUser?.id ?? null);

  if (!user || !currentUser) return <main><p>chargement</p></main>;

  return (
    <main>
      <UserDetails profil={user} my_id={currentUser.id}/>
    </main>
  );
}

export default ProfilPage;
