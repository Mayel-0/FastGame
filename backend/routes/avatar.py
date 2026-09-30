import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from db.database import get_db
from models.users import UserModel
from routes.users import get_current_user

# --- Emplacement des fichiers sur le serveur : backend/media/avatars/ ---
MEDIA_DIR = Path(__file__).resolve().parents[1] / "media"
AVATAR_DIR = (MEDIA_DIR / "avatars").resolve()
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

# URL publique (sous /api pour passer par le même proxy que le reste de l'API)
MEDIA_URL = "/api/media"
DEFAULT_AVATAR_URL = f"{MEDIA_URL}/default-avatar.svg"

MAX_UPLOAD_BYTES = 2 * 1024 * 1024        # 2 Mo
MAX_PIXELS = 25_000_000                   # protège contre les images géantes (decompression bomb)
AVATAR_SIZE = 256                         # avatar final : 256 x 256 px
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

Image.MAX_IMAGE_PIXELS = MAX_PIXELS

router = APIRouter(
    prefix="/api/users/me",
    tags=["Avatar"],
)


def _delete_avatar_file(image_url: str | None) -> None:
    """Supprime l'ancien fichier, uniquement s'il se trouve bien dans le dossier des avatars."""
    if not image_url or not image_url.startswith(f"{MEDIA_URL}/avatars/"):
        return
    path = (AVATAR_DIR / Path(image_url).name).resolve()
    if path.parent == AVATAR_DIR:
        path.unlink(missing_ok=True)


# ---------------------------------------------------------
# POST /api/users/me/avatar : envoyer une nouvelle photo de profil
# ---------------------------------------------------------
@router.post("/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image trop lourde (2 Mo maximum).",
        )

    # On ne fait pas confiance au nom, à l'extension ni au Content-Type :
    # Pillow doit réellement réussir à décoder l'image.
    try:
        with Image.open(BytesIO(data)) as img:
            if img.format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Format accepté : JPEG, PNG ou WebP.",
                )
            if img.width * img.height > MAX_PIXELS:
                raise HTTPException(status_code=400, detail="Image trop grande.")

            img = ImageOps.exif_transpose(img).convert("RGBA")
            img = ImageOps.fit(img, (AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)

            # Ré-encodage complet en WebP : supprime les métadonnées (GPS, EXIF)
            # et tout contenu caché dans le fichier d'origine.
            buffer = BytesIO()
            img.save(buffer, format="WEBP", quality=85)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Fichier image invalide.")

    # Nom généré côté serveur : jamais le nom envoyé par l'utilisateur
    filename = f"{uuid.uuid4().hex}.webp"
    new_path = AVATAR_DIR / filename
    new_path.write_bytes(buffer.getvalue())
    new_url = f"{MEDIA_URL}/avatars/{filename}"

    user = db.get(UserModel, current_user.id)
    old_url = user.image_url
    user.image_url = new_url
    try:
        db.commit()
    except Exception:
        db.rollback()
        new_path.unlink(missing_ok=True)
        raise

    _delete_avatar_file(old_url)
    return {"image_url": new_url}


# ---------------------------------------------------------
# DELETE /api/users/me/avatar : revenir à l'avatar par défaut
# ---------------------------------------------------------
@router.delete("/avatar")
def reset_avatar(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.get(UserModel, current_user.id)
    old_url = user.image_url
    user.image_url = DEFAULT_AVATAR_URL
    db.commit()

    _delete_avatar_file(old_url)
    return {"image_url": DEFAULT_AVATAR_URL}
