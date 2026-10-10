import { Heart, ListPlus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Activity } from "../models/activite";
import { formatRelativeDate } from "../utils/date";
import { toSlug } from "../utils/slug";
import UserIdentity from "./UserIdentity";

interface ActivityFeedProps {
  activities: Activity[];
}

function ActivityIcon({ type }: { type: Activity["type"] }) {
  if (type === "note") return <Star size={16} aria-hidden="true" />;
  if (type === "like") return <Heart size={16} aria-hidden="true" />;
  return <ListPlus size={16} aria-hidden="true" />;
}

function ActivityTarget({ activity }: { activity: Activity }) {
  if (activity.liste) {
    return (
      <Link className="activity-feed__target" to={`/listes/public/${activity.liste.id}`}>
        {activity.liste.title}
      </Link>
    );
  }
  if (activity.game) {
    return (
      <Link className="activity-feed__target" to={`/jeux/d/${toSlug(activity.game.titre ?? "")}`}>
        {activity.game.titre || "Jeu sans titre"}
      </Link>
    );
  }
  return null;
}

const ACTIONS: Record<Activity["type"], string> = {
  note: "a noté",
  like: "a aimé",
  liste: "a créé la liste",
};

function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <ol className="activity-feed">
      {activities.map((activity, index) => (
        <li className="activity-feed__item" key={`${activity.type}-${activity.user.id}-${activity.created_at}-${index}`}>
          <span className={`activity-feed__icon activity-feed__icon--${activity.type}`}>
            <ActivityIcon type={activity.type} />
          </span>
          <div className="activity-feed__body">
            <div className="activity-feed__line">
              <UserIdentity
                userId={activity.user.id}
                username={activity.user.username}
                imageUrl={activity.user.image_url}
              />
              <span className="activity-feed__action">{ACTIONS[activity.type]}</span>
              <ActivityTarget activity={activity} />
              {activity.type === "note" && activity.note_value !== null && (
                <span className="activity-feed__badge">{activity.note_value}/5</span>
              )}
            </div>
            {activity.note_body && <p className="activity-feed__comment">{activity.note_body}</p>}
            {activity.liste && (
              <p className="activity-feed__comment">{activity.liste.items_count} jeux dans cette liste.</p>
            )}
            <time className="activity-feed__date" dateTime={activity.created_at}>
              {formatRelativeDate(activity.created_at)}
            </time>
          </div>
          {activity.game?.image && (
            <img className="activity-feed__image" src={activity.game.image} alt="" loading="lazy" />
          )}
        </li>
      ))}
    </ol>
  );
}

export default ActivityFeed;
