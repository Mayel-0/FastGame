import ListesList from "../components/Listelist";
import useUserLists from "../hooks/useUserLists";
import PageLoader from "../components/pageLoader";
import { useState } from "react";

function PageListe() {
  const { joinedLists, loading, createList, updateList } = useUserLists();
  const isLoading = [loading].some(Boolean);
  const [newListTitle, setNewListTitle] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const formattedLists = joinedLists.map((item) => ({
    id: item.list_id,
    users_id: 0,
    liste_title: item.title,
    items_count: item.items_count,
    public: item.public,
    created_at: item.created_at,
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const success = await createList(newListTitle, isPublic);
    if (success) {
      setNewListTitle("");
    }
  };

  return (
    <main className="page-liste">
      <PageLoader loading={isLoading}>
        <div className="page-liste__header">
          <p className="page-liste__eyebrow">Mes listes</p>
          <h1 className="page-liste__title">Organise tes jeux</h1>
          <p className="page-liste__intro">
            Crée des listes personnalisées pour ranger tes jeux favoris, tes likes ou tes découvertes à venir.
          </p>
        </div>

        <form className="page-liste__form" onSubmit={handleCreate}>
          <label className="page-liste__field">
            <span>Nom de la liste</span>
            <input
              className="page-liste__input"
              type="text"
              placeholder="Titre de la nouvelle liste..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
            />
          </label>

          <label className="page-liste__toggle">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Publique
          </label>

          <button className="page-liste__submit" type="submit">Créer la liste</button>
        </form>

        <ListesList listes={formattedLists} updateList={updateList} />
      </PageLoader>
    </main>
  );
}

export default PageListe;
