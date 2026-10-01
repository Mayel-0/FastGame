import { use } from "react";
import type { AbonnementWithUser } from "../models/abonnement";

interface propsListAbonnements {
  users: AbonnementWithUser[];
}

function ListAbonnements({ users }: propsListAbonnements) {
  return (
    <section>
      <ul>
      {users.map((user) => (
        <li key={user.abonnement_id}>{user.user.username}</li>
      ))}
      </ul>
    </section>
  )
}

export default ListAbonnements;
