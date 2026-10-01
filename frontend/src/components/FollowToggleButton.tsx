import { useState } from "react";

interface FollowToggleButtonProps {
  userId: number;
  isFollowing: boolean;
  disabled?: boolean;
  onToggle: (userId: number) => Promise<boolean>;
}

export default function FollowToggleButton({
  userId,
  isFollowing,
  disabled = false,
  onToggle,
}: FollowToggleButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleToggle() {
    setPending(true);
    setError(false);
    try {
      if (!(await onToggle(userId))) setError(true);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="follow-toggle">
      <button
        className={`follow-toggle__button${isFollowing ? " follow-toggle__button--following" : ""}`}
        type="button"
        aria-pressed={isFollowing}
        disabled={disabled || pending}
        onClick={handleToggle}
      >
        {pending ? "Mise à jour…" : isFollowing ? "Se désabonner" : "S’abonner"}
      </button>
      {error && <span className="follow-toggle__error" role="alert">Action impossible. Réessayez.</span>}
    </div>
  );
}
