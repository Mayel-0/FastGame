import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../utils/media";

interface UserIdentityProps {
  userId: number;
  username: string;
  imageUrl?: string | null;
}

export default function UserIdentity({ userId, username, imageUrl }: UserIdentityProps) {
  return (
    <Link className="user-identity" to={`/profil/${userId}`}>
      <img className="user-identity__avatar" src={resolveMediaUrl(imageUrl)} alt="" />
      <span className="user-identity__name">{username}</span>
    </Link>
  );
}
