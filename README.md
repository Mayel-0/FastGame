# FastGame

Catalogue de jeux vidéo communautaire : on parcourt les jeux, on les note, on les like, on crée des listes et on suit d'autres joueurs.

Projet B2 Ynov — API **FastAPI** + interface **React / TypeScript**.

**Version en ligne : https://fastgames.mael-llado.com**

## Quickstart

**Prérequis :** Python 3.10 à 3.12, Node.js 20.19+ (ou 22.12+), et le fichier `.env` du backend fourni avec le rendu.

### 1. Récupérer le projet

```bash
git clone https://github.com/Mayel-0/FastGame.git
cd FastGame
```

Copiez ensuite le fichier `.env` fourni dans le dossier `backend/` (il contient l'accès à la base de données).

### 2. Lancer le backend (terminal 1)

macOS / Linux :

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Windows (PowerShell) :

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

L'API tourne sur http://localhost:8000 et sa documentation interactive sur http://localhost:8000/docs.

### 3. Lancer le frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Le site est disponible sur **http://localhost:5173**. Aucune configuration n'est nécessaire côté frontend.

### 4. Essayer

Créez un compte depuis **s'inscrire**, connectez-vous, puis notez un jeu, likez-en quelques-uns et créez une liste.

## Sans le fichier `.env` fourni

Le backend a besoin d'une base PostgreSQL contenant déjà les tables du projet. Pour utiliser la vôtre :

```bash
cd backend
cp .env.example .env
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(48))" >> .env
```

Renseignez ensuite `DATABASE_URL` dans `backend/.env`, et supprimez la ligne `JWT_SECRET_KEY=` restée vide.

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | oui | URL de connexion PostgreSQL |
| `JWT_SECRET_KEY` | oui | Clé de signature des tokens, 64 caractères minimum |
| `ENVIRONMENT` | non | `development` (défaut) ou `production` (désactive `/docs`) |
| `CORS_ORIGINS` | non | Origines autorisées, séparées par des virgules |
| `ALLOWED_HOSTS` | non | Hôtes autorisés, séparés par des virgules |
| `STEAM_API_KEY` | non | Récupère le pseudo et l'avatar lors de la liaison Steam |

Côté frontend, `VITE_API_URL` (dans `frontend/.env`) permet de pointer vers une autre API que `http://localhost:8000`.

## Fonctionnalités

- Inscription, connexion par token JWT, modification du profil et de l'avatar
- Catalogue de jeux avec recherche et filtre par genre
- Fiche détaillée d'un jeu avec notes et commentaires des joueurs
- Likes et favoris
- Listes personnelles, publiques ou privées
- Page communauté : classements des jeux, membres les plus populaires, listes publiques à liker
- Abonnements entre joueurs

## Tests

```bash
cd backend
source .venv/bin/activate
python -m unittest tests/test_likes_join.py tests/test_session_cookie.py
```

Les tests utilisent une base SQLite en mémoire : ils ne touchent pas à la vraie base, mais le fichier `backend/.env` doit exister.

Vérification du frontend :

```bash
cd frontend
npm run build
```

## Structure

```
FastGame/
├── backend/
│   ├── main.py          point d'entrée de l'API
│   ├── db/              connexion à la base
│   ├── models/          modèles SQLAlchemy et schémas Pydantic
│   ├── routes/          une route par ressource (jeux, notes, likes, listes…)
│   ├── utils/           hachage des mots de passe et tokens JWT
│   ├── media/           avatars
│   └── tests/
└── frontend/
    └── src/
        ├── views/       pages
        ├── components/  composants réutilisables
        ├── hooks/       appels à l'API
        ├── context/     authentification
        ├── models/      types TypeScript
        ├── utils/
        └── styles/      SCSS
```

## Stack

| Partie | Technologies |
| --- | --- |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, PostgreSQL, JWT, bcrypt |
| Frontend | React 19, TypeScript, Vite, React Router, Sass |

## Équipe

- mael
- tdreser0
