import type Profil from "../models/profil";

interface UserDetailsProps {
  profil: Profil;
  my_id: number;
}

function UserDetails({profil, my_id}:UserDetailsProps) {
  const isMe = profil.id === my_id;
  return (
    <section>
      {isMe && <p>mon profile</p>}
      {!isMe && <p>autre profile</p>}
    </section>
  );
}

export default UserDetails;
