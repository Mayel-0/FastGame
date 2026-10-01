export interface Abonnement {
  id: number;
  user_id: number;
  follow_id: number;
  abonned_at: string;
}

export interface AbonnementCreate {
  follow_id: number;
}

export interface AbonnementWithUser {
  abonnement_id: number;
  abonned_at: string;
  user: {
    id: number;
    username?: string;
    email?: string;
    avatar?: string | null;
  };
}
