import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from routes.games import router as games_router
from routes.id import router as game_id_router
from routes.title import router as game_title_router
from routes.studio import router as studio_router
from routes.plateforme import router as plateforme_router
from routes.annee import router as annee_router
from routes.genre import router as genre_router
from routes.likes import router as likes_router
from routes.notes import router as notes_router
from routes.users import router as users_router
from routes.lists import router as lists_router
from routes.favoris import router as favoris_router
from routes.steam import router as steam_router
from routes.avatar import router as avatar_router, MEDIA_DIR
from routes.abonnement import router as abonnements_router


is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
app = FastAPI(
    title="FastGame API",
    version="1.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
)

# 1. Définir les origines autorisées (les domaines qui ont le droit d'appeler ton API)
origins = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS",
    "https://fastgames.mael-llado.com,http://fastgames.mael-llado.com,http://localhost:3000,http://localhost:5173",
).split(",") if origin.strip()]

allowed_hosts = [host.strip() for host in os.getenv(
    "ALLOWED_HOSTS",
    "fastgames.mael-llado.com,localhost,127.0.0.1",
).split(",") if host.strip()]

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# 2. Ajouter le middleware CORS à l'application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Ou ["*"] pour tout autoriser
    allow_credentials=True,
    allow_methods=["*"],    # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],    # Autorise tous les headers
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Inclusion de tes routes
app.include_router(games_router)
app.include_router(game_id_router)
app.include_router(game_title_router)
app.include_router(studio_router)
app.include_router(plateforme_router)
app.include_router(annee_router)
app.include_router(genre_router)
app.include_router(likes_router)
app.include_router(notes_router)
app.include_router(users_router)
app.include_router(lists_router)
app.include_router(favoris_router)
app.include_router(steam_router)
app.include_router(avatar_router)
app.include_router(abonnements_router)
# Fichiers statiques : avatar par défaut et photos de profil (backend/media/)
# Placé après les routers, sous /api pour passer par le même proxy nginx que l'API
app.mount("/api/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API FastGame connectée à Supabase ! 🚀"}
