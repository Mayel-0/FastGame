import { useState } from "react";
import type Profil from "../models/profil";

interface UserDetailsProps {
  profil: Profil;
  my_id: number;
}

function UserDetails({profil, my_id}:UserDetailsProps) {
  const [isMe, setIsMe] = useState<boolean>(false)
  if (profil.id === my_id) {
    setIsMe(true)
  }
  return (
    <section>
      {isMe && <p>mon profile</p>}
      {!isMe && <p>autre profile</p>}
    </section>
  );
}

export default UserDetails;
