from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.games import router as games_router
from routes.id import router as game_id_router
from routes.title import router as game_title_router
from routes.studio import router as studio_router
from routes.plateforme import router as plateforme_router
from routes.annee import router as annee_router
from routes.genre import router as genre_router
from routes.likes import router as likes_router
from routes.users import router as users_router

app = FastAPI(title="FastGame API", version="1.0")

# 1. Définir les origines autorisées (les domaines qui ont le droit d'appeler ton API)
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# 2. Ajouter le middleware CORS à l'application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Ou ["*"] pour tout autoriser
    allow_credentials=True,
    allow_methods=["*"],    # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],    # Autorise tous les headers
)

# Inclusion de tes routes
app.include_router(games_router)
app.include_router(game_id_router)
app.include_router(game_title_router)
app.include_router(studio_router)
app.include_router(plateforme_router)
app.include_router(annee_router)
app.include_router(genre_router)
app.include_router(likes_router)
app.include_router(users_router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API FastGame connectée à Supabase ! 🚀"}
