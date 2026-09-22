import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "", bio: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? "Impossible de créer le compte.");
      }
      navigate("/login", { state: { registered: true } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="register-title">
        <p className="auth-panel__eyebrow">Rejoins la communauté</p>
        <h2 id="register-title">Créer un compte</h2>
        <p className="auth-panel__intro">Enregistre ton profil pour personnaliser ton expérience.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-username">Nom d’utilisateur</label>
          <input id="register-username" value={form.username} onChange={(event) => updateField("username", event.target.value)} required autoComplete="username" />

          <label htmlFor="register-email">Email</label>
          <input id="register-email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required autoComplete="email" />

          <label htmlFor="register-password">Mot de passe</label>
          <input id="register-password" type="password" minLength={8} value={form.password} onChange={(event) => updateField("password", event.target.value)} required autoComplete="new-password" />

          <label htmlFor="register-bio">Bio <span>(facultatif)</span></label>
          <textarea id="register-bio" rows={3} value={form.bio} onChange={(event) => updateField("bio", event.target.value)} />

          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Création..." : "Créer mon compte"}</button>
        </form>

        <p className="auth-panel__footer">Tu as déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </section>

    </main>
  );
}

export default RegisterPage;
