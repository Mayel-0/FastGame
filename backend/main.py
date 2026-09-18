from fastapi import FastAPI
from routes.games import router as games_router

app = FastAPI(title="FastGame API", version="1.0")

# Inclusion du routeur des jeux
app.include_router(games_router)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API FastGame connectée à Supabase ! 🚀"}