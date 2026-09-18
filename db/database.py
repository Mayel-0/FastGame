import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Charge les variables du fichier .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Création du moteur de connexion PostgreSQL (Supabase)
engine = create_engine(DATABASE_URL)

# Création de la session pour communiquer avec la DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Fonction utilitaire pour injecter la session dans tes routes FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()