# FastGame

Projet organise en deux applications : une API FastAPI et une interface React avec React Router.

## Structure

```text
FastGame/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
├── backend/requirements.txt
└── README.md
```

## Installation

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Les dependances backend sont listees dans [backend/requirements.txt](backend/requirements.txt).

### Frontend

```bash
cd frontend
npm install react react-dom react-router-dom axios
npm install -D vite typescript @vitejs/plugin-react @types/react @types/react-dom eslint
```
