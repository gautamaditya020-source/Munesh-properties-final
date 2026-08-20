import os
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
ADMIN_USERNAME = os.environ['ADMIN_USERNAME']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ADMIN_PASSWORD_HASH = pwd_context.hash(ADMIN_PASSWORD)

# Object storage
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "munesh-properties"
_storage_key = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    global _storage_key
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 503:
        _storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    global _storage_key
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 503:
        _storage_key = None
        key = init_storage()
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ----------------------------------------------------------------------------
# App
# ----------------------------------------------------------------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

PROPERTY_TYPES = ["plot", "home", "land", "shop"]
LOCATIONS = ["Khair", "Aligarh", "Mathura Road", "Agra Road", "Jewar", "Tapal", "Jatari", "New Yamuna Expressway"]


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MediaItem(BaseModel):
    path: str
    type: str  # image | video
    url: str


class PropertyBase(BaseModel):
    title: str
    property_type: str
    location: str
    price: str
    area: str = ""
    description: str = ""
    amenities: List[str] = []
    status: str = "available"  # available | sold
    featured: bool = False
    media: List[MediaItem] = []


class PropertyCreate(PropertyBase):
    pass


class Property(PropertyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContactSettings(BaseModel):
    whatsapp: str = "+919876543210"
    telegram: str = "muneshproperties"
    phone: str = "+919876543210"
    email: str = "info@muneshproperties.com"
    address: str = "Khair, Aligarh, Uttar Pradesh"
    about: str = "Munesh Properties — Your trusted partner for plots, homes, land and shops across Uttar Pradesh."


class EnquiryCreate(BaseModel):
    name: str
    phone: str
    email: str = ""
    message: str = ""
    property_id: Optional[str] = None
    property_title: Optional[str] = None


class Enquiry(EnquiryCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ----------------------------------------------------------------------------
# Auth helpers
# ----------------------------------------------------------------------------
def create_access_token(username: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": username, "role": "admin", "exp": expires}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def require_admin(token: Annotated[Optional[str], Depends(oauth2_scheme)]):
    err = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired credentials",
                        headers={"WWW-Authenticate": "Bearer"})
    if not token:
        raise err
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("sub") != ADMIN_USERNAME or payload.get("role") != "admin":
            raise err
    except jwt.PyJWTError:
        raise err
    return {"username": ADMIN_USERNAME, "role": "admin"}


# ----------------------------------------------------------------------------
# Auth routes
# ----------------------------------------------------------------------------
@api_router.post("/auth/login", response_model=Token)
async def login(body: LoginRequest):
    valid = (body.username == ADMIN_USERNAME) and pwd_context.verify(body.password, ADMIN_PASSWORD_HASH)
    await db.login_audit.insert_one({
        "username": body.username,
        "success": valid,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if not valid:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return Token(access_token=create_access_token(ADMIN_USERNAME))


@api_router.get("/auth/me")
async def me(admin=Depends(require_admin)):
    return admin


# ----------------------------------------------------------------------------
# Public routes
# ----------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Munesh Properties API"}


@api_router.get("/meta")
async def meta():
    return {"property_types": PROPERTY_TYPES, "locations": LOCATIONS}


@api_router.get("/properties", response_model=List[Property])
async def list_properties(
    property_type: Optional[str] = None,
    location: Optional[str] = None,
    q: Optional[str] = None,
    featured: Optional[bool] = None,
):
    query = {}
    if property_type and property_type != "all":
        query["property_type"] = property_type
    if location and location != "all":
        query["location"] = location
    if featured is not None:
        query["featured"] = featured
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.properties.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Property(**d) for d in docs]


@api_router.get("/properties/{property_id}", response_model=Property)
async def get_property(property_id: str):
    doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return Property(**doc)


@api_router.get("/contact", response_model=ContactSettings)
async def get_contact():
    doc = await db.settings.find_one({"key": "contact"}, {"_id": 0})
    if not doc:
        return ContactSettings()
    return ContactSettings(**{k: v for k, v in doc.items() if k != "key"})


@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(body: EnquiryCreate):
    obj = Enquiry(**body.dict())
    await db.enquiries.insert_one(obj.dict())
    return obj


@api_router.get("/files/{file_path:path}")
async def serve_file(file_path: str):
    try:
        content, content_type = await run_in_threadpool(get_object, file_path)
    except Exception as e:
        logger.error(f"file serve error {file_path}: {e}")
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=content, media_type=content_type,
                    headers={"Cache-Control": "public, max-age=31536000"})


# ----------------------------------------------------------------------------
# Admin routes
# ----------------------------------------------------------------------------
@api_router.post("/admin/upload")
async def upload_file(file: UploadFile = File(...), admin=Depends(require_admin)):
    data = await file.read()
    ext = (file.filename or "file").split(".")[-1].lower()
    kind = "video" if (file.content_type or "").startswith("video") or ext in ["mp4", "mov", "webm", "m4v"] else "image"
    path = f"{APP_NAME}/uploads/{ADMIN_USERNAME}/{uuid.uuid4()}.{ext}"
    try:
        result = await run_in_threadpool(put_object, path, data, file.content_type or "application/octet-stream")
    except requests.HTTPError as e:
        code = e.response.status_code if e.response is not None else 500
        if code == 402:
            raise HTTPException(status_code=402, detail="Storage credits exhausted")
        raise HTTPException(status_code=500, detail="Upload failed")
    stored_path = result["path"]
    return {"path": stored_path, "type": kind, "url": f"/api/files/{stored_path}"}


@api_router.post("/admin/properties", response_model=Property)
async def create_property(body: PropertyCreate, admin=Depends(require_admin)):
    obj = Property(**body.dict())
    await db.properties.insert_one(obj.dict())
    return obj


@api_router.put("/admin/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, body: PropertyCreate, admin=Depends(require_admin)):
    existing = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    updated = {**existing, **body.dict()}
    await db.properties.update_one({"id": property_id}, {"$set": body.dict()})
    return Property(**updated)


@api_router.delete("/admin/properties/{property_id}")
async def delete_property(property_id: str, admin=Depends(require_admin)):
    res = await db.properties.delete_one({"id": property_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"ok": True}


@api_router.put("/admin/contact", response_model=ContactSettings)
async def update_contact(body: ContactSettings, admin=Depends(require_admin)):
    await db.settings.update_one({"key": "contact"}, {"$set": {**body.dict(), "key": "contact"}}, upsert=True)
    return body


@api_router.get("/admin/enquiries", response_model=List[Enquiry])
async def list_enquiries(admin=Depends(require_admin)):
    docs = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Enquiry(**d) for d in docs]


@api_router.delete("/admin/enquiries/{enquiry_id}")
async def delete_enquiry(enquiry_id: str, admin=Depends(require_admin)):
    await db.enquiries.delete_one({"id": enquiry_id})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await run_in_threadpool(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
