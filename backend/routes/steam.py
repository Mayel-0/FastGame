from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from db.database import get_db
from models.users import UserModel
from models.steam import SteamAccountModel, SteamAccountSchema
from routes.users import get_current_user
from utils.security import create_access_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import httpx
import os

router = APIRouter(prefix="/api/steam", tags=["Steam"])

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_KEY = os.getenv("STEAM_API_KEY")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ------------------------------------------------------------------
# 1. GET /api/steam/link
#    Redirige l'user connecté vers Steam OpenID
#    On glisse son JWT dans le return_to pour le retrouver au callback
# ------------------------------------------------------------------
@router.get("/link")
def link_steam(current_user: UserModel = Depends(get_current_user)):
    token = create_access_token(data={"sub": current_user.email})

    params = "&".join([
        "openid.ns=http://specs.openid.net/auth/2.0",
        "openid.mode=checkid_setup",
        f"openid.return_to={BASE_URL}/api/steam/callback?token={token}",
        f"openid.realm={BASE_URL}",
        "openid.identity=http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select",
    ])

    return RedirectResponse(url=f"{STEAM_OPENID_URL}?{params}")


# ------------------------------------------------------------------
# 2. GET /api/steam/callback
#    Steam redirige ici après auth
#    On valide, on récupère les infos Steam, on sauvegarde
# ------------------------------------------------------------------
@router.get("/callback")
async def steam_callback(request: Request, db: Session = Depends(get_db)):

    params = dict(request.query_params)

    # --- Extraire le steamId64 ---
    claimed_id = params.get("openid.claimed_id", "")
    if not claimed_id or "/openid/id/" not in claimed_id:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=invalid_id")

    steam_id = claimed_id.split("/openid/id/")[-1]
    if not steam_id.isdigit():
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=invalid_id")

    # --- Valider auprès de Steam (obligatoire, ne pas sauter) ---
    validation_params = {**params, "openid.mode": "check_authentication"}
    async with httpx.AsyncClient() as client:
        validation = await client.post(STEAM_OPENID_URL, data=validation_params)

    if "is_valid:true" not in validation.text:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=validation_failed")

    # --- Identifier l'user via le JWT passé dans l'URL ---
    token = params.get("token")
    if not token:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=missing_token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(UserModel).filter(UserModel.email == email).first()
    except JWTError:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=invalid_token")

    if not user:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=user_not_found")

    # --- Vérifier que ce steamId n'est pas déjà lié à un autre compte ---
    existing = db.query(SteamAccountModel).filter(
        SteamAccountModel.steam_id == steam_id,
        SteamAccountModel.user_id != user.id
    ).first()
    if existing:
        return RedirectResponse(f"{FRONTEND_URL}/settings?steam_error=already_linked")

    # --- Récupérer les infos du profil Steam via l'API publique ---
    steam_name = None
    avatar_url = None

    if STEAM_API_KEY:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
                params={"key": STEAM_API_KEY, "steamids": steam_id}
            )
            data = res.json()
            players = data.get("response", {}).get("players", [])
            if players:
                steam_name = players[0].get("personaname")
                avatar_url = players[0].get("avatarfull")

    # --- Upsert dans steam_accounts ---
    steam_account = db.query(SteamAccountModel).filter(
        SteamAccountModel.user_id == user.id
    ).first()

    if steam_account:
        # Déjà lié → on met à jour
        steam_account.steam_id = steam_id
        steam_account.steam_name = steam_name
        steam_account.avatar_url = avatar_url
    else:
        # Nouveau lien
        steam_account = SteamAccountModel(
            user_id=user.id,
            steam_id=steam_id,
            steam_name=steam_name,
            avatar_url=avatar_url,
        )
        db.add(steam_account)

    db.commit()

    return RedirectResponse(
        f"{FRONTEND_URL}/settings?steam_success=true&steam_name={steam_name}"
    )


# ------------------------------------------------------------------
# 3. GET /api/steam/me
#    Récupère les infos Steam de l'user connecté
# ------------------------------------------------------------------
@router.get("/me", response_model=SteamAccountSchema)
def get_my_steam(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(SteamAccountModel).filter(
        SteamAccountModel.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Aucun compte Steam lié.")

    return account


# ------------------------------------------------------------------
# 4. DELETE /api/steam/unlink
#    Délier le compte Steam
# ------------------------------------------------------------------
@router.delete("/unlink", status_code=204)
def unlink_steam(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(SteamAccountModel).filter(
        SteamAccountModel.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Aucun compte Steam lié.")

    db.delete(account)
    db.commit()
    return None
