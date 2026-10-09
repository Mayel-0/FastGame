import os
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from db.database import get_db
from models.steam import SteamAccountModel, SteamAccountSchema
from models.users import UserModel
from routes.users import get_current_user, get_user_from_token
from utils.security import create_access_token

router = APIRouter(prefix="/api/steam", tags=["Steam"])

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"
STEAM_API_KEY = os.getenv("STEAM_API_KEY")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _redirect_to_profile(**params: str) -> RedirectResponse:
    return RedirectResponse(f"{FRONTEND_URL}/profil?{urlencode(params)}")


@router.get("/link")
def link_steam(current_user: UserModel = Depends(get_current_user)):
    token = create_access_token(data={"sub": str(current_user.id)})

    params = urlencode({
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": f"{BASE_URL}/api/steam/callback?{urlencode({'token': token})}",
        "openid.realm": BASE_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    })

    return RedirectResponse(url=f"{STEAM_OPENID_URL}?{params}")


@router.get("/callback")
async def steam_callback(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)

    claimed_id = params.get("openid.claimed_id", "")
    steam_id = claimed_id.split("/openid/id/")[-1]
    if "/openid/id/" not in claimed_id or not steam_id.isdigit():
        return _redirect_to_profile(steam_error="invalid_id")

    validation_params = {
        key: value for key, value in params.items() if key.startswith("openid.")
    }
    validation_params["openid.mode"] = "check_authentication"
    try:
        async with httpx.AsyncClient() as client:
            validation = await client.post(STEAM_OPENID_URL, data=validation_params)
    except httpx.HTTPError:
        return _redirect_to_profile(steam_error="validation_failed")

    if "is_valid:true" not in validation.text:
        return _redirect_to_profile(steam_error="validation_failed")

    token = params.get("token")
    if not token:
        return _redirect_to_profile(steam_error="missing_token")

    user = get_user_from_token(token, db)
    if not user:
        return _redirect_to_profile(steam_error="invalid_token")

    existing = db.query(SteamAccountModel).filter(
        SteamAccountModel.steam_id == steam_id,
        SteamAccountModel.user_id != user.id
    ).first()
    if existing:
        return _redirect_to_profile(steam_error="already_linked")

    steam_name = None
    avatar_url = None

    if STEAM_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
                    params={"key": STEAM_API_KEY, "steamids": steam_id}
                )
            players = res.json().get("response", {}).get("players", [])
        except (httpx.HTTPError, ValueError):
            players = []
        if players:
            steam_name = players[0].get("personaname")
            avatar_url = players[0].get("avatarfull")

    steam_account = db.query(SteamAccountModel).filter(
        SteamAccountModel.user_id == user.id
    ).first()

    if steam_account:
        steam_account.steam_id = steam_id
        steam_account.steam_name = steam_name
        steam_account.avatar_url = avatar_url
    else:
        steam_account = SteamAccountModel(
            user_id=user.id,
            steam_id=steam_id,
            steam_name=steam_name,
            avatar_url=avatar_url,
        )
        db.add(steam_account)

    db.commit()

    return _redirect_to_profile(steam_success="true", steam_name=steam_name or "")


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
