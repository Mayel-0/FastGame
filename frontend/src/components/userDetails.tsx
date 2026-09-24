import { useState } from "react";
import ProfileField from "./ProfileField";
import { useAuth } from "../context/AuthContext";
import type Profil from "../models/profil";

interface UserDetailsProps {
  profil: Profil;
  currentUser: Profil | null;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function UserDetails({ profil, currentUser }: UserDetailsProps) {
  const { authFetch } = useAuth();
  const isMe = currentUser?.id === profil.id;
  const [profile, setProfile] = useState(profil);
  const [email, setEmail] = useState(currentUser?.email ?? "");

  async function updateField(field: "username" | "bio" | "email" | "password", value: string) {
    if (!isMe || !currentUser) return;

    const response = await authFetch(`${API_URL}/api/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    const data = (await response.json().catch(() => ({}))) as Profil & { detail?: string };
    if (!response.ok) throw new Error(data.detail ?? "Impossible de modifier le profil.");

    setProfile(data);
    if (field === "email") setEmail(value);
  }

  return (
    <section className="profile-details" aria-labelledby="profile-title">
      <div className="profile-details__heading">
        <p className="profile-details__eyebrow">{isMe ? "Mon profil" : "Profil joueur"}</p>
        <h1 id="profile-title">{profile.username}</h1>
        <p className="profile-details__status">{isMe ? "Gerez vos informations personnelles." : "Profil public en lecture seule."}</p>
      </div>

      <div className="profile-details__fields">
        <ProfileField label="Nom d'utilisateur" value={profile.username} editable={isMe} onSave={(value) => updateField("username", value)} />
        <ProfileField label="Bio" value={profile.bio ?? ""} type="textarea" editable={isMe} onSave={(value) => updateField("bio", value)} />
        {isMe && (
          <>
            <ProfileField label="Email" value={email} type="email" editable onSave={(value) => updateField("email", value)} />
            <ProfileField label="Mot de passe" value="" type="password" editable onSave={(value) => updateField("password", value)} />
          </>
        )}
      </div>
    </section>
  );
}

export default UserDetails;
