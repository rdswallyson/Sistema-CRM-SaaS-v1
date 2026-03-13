from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from typing import Optional, List, Dict, Any
from ..core.security import require_church_admin, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.media import Media, MediaType, Form, FormField, FormResponse, Album
from datetime import datetime, timezone
import uuid
import hashlib
import os

router = APIRouter(prefix="/church/media", tags=["Mídias"])

ALLOWED_EXTENSIONS = {
    "foto": {"jpg", "jpeg", "png", "gif", "webp"},
    "video": {"mp4", "avi", "mov", "mkv", "webm"},
    "documento": {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"},
    "arquivo": {"zip", "rar", "7z", "tar", "gz"}
}

def validate_file_extension(filename: str, media_type: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS.get(media_type, set())

def calculate_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

# ==================== MEDIA UPLOAD ====================
@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    tipo: MediaType = Query(...),
    modulo_vinculado: Optional[str] = None,
    referencia_id: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    # Validate file
    if not validate_file_extension(file.filename, tipo.value):
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo não permitido para {tipo.value}")
    
    # Read file content
    content = await file.read()
    file_hash = calculate_file_hash(content)
    
    # Check for duplicates
    existing = await db.medias.find_one({"hash_arquivo": file_hash, "organizacao_id": org_id, "deletado_em": None})
    if existing:
        return success_response(data=existing, meta={"duplicado": True})
    
    # Save file (simplified - in production use S3 or similar)
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = f"uploads/{org_id}/{filename}"
    
    # Create media record
    media = Media(
        nome=file.filename,
        tipo=tipo,
        caminho=filepath,
        tamanho_bytes=len(content),
        hash_arquivo=file_hash,
        modulo_vinculado=modulo_vinculado,
        referencia_id=referencia_id,
        organizacao_id=org_id,
        usuario_id=user_id
    )
    doc = media.model_dump()
    await db.medias.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/")
async def list_media(
    tipo: Optional[MediaType] = None,
    modulo_vinculado: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    if tipo: query["tipo"] = tipo
    if modulo_vinculado: query["modulo_vinculado"] = modulo_vinculado
    if search: query["nome"] = {"$regex": search, "$options": "i"}
    
    medias = await db.medias.find(query).sort("criado_em", -1).to_list(100)
    return success_response(data=medias)

@router.get("/library-stats")
async def get_library_stats(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    
    total_files = await db.medias.count_documents(query)
    total_size = 0
    
    stats = {}
    for media_type in MediaType:
        count = await db.medias.count_documents({**query, "tipo": media_type})
        stats[media_type.value] = count
        
        # Calculate total size
        pipeline = [
            {"$match": {**query, "tipo": media_type}},
            {"$group": {"_id": None, "total": {"$sum": "$tamanho_bytes"}}}
        ]
        result = await db.medias.aggregate(pipeline).to_list(1)
        if result:
            total_size += result[0].get("total", 0)
    
    return success_response(data={
        "total_files": total_files,
        "total_size_bytes": total_size,
        "by_type": stats
    })

# ==================== FORMS ====================
@router.post("/forms")
async def create_form(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    form = Form(**data, organizacao_id=org_id, usuario_id=user_id)
    doc = form.model_dump()
    await db.forms.insert_one(doc)
    
    return success_response(data=doc)

@router.post("/forms/{form_id}/fields")
async def add_form_field(form_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    form = await db.forms.find_one({"id": form_id, "organizacao_id": org_id, "deletado_em": None})
    if not form:
        raise HTTPException(status_code=404, detail="Formulário não encontrado")
    
    field = FormField(**data, formulario_id=form_id, organizacao_id=org_id)
    doc = field.model_dump()
    await db.form_fields.insert_one(doc)
    
    return success_response(data=doc)

@router.post("/forms/{form_id}/responses")
async def submit_form_response(form_id: str, data: Dict[str, Any]):
    """Public endpoint for form submissions."""
    form = await db.forms.find_one({"id": form_id, "deletado_em": None})
    if not form:
        raise HTTPException(status_code=404, detail="Formulário não encontrado")
    
    response = FormResponse(
        formulario_id=form_id,
        respostas=data.get("respostas", {}),
        email_respondente=data.get("email"),
        organizacao_id=form["organizacao_id"]
    )
    doc = response.model_dump()
    await db.form_responses.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/forms/{form_id}/responses")
async def get_form_responses(form_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    
    form = await db.forms.find_one({"id": form_id, "organizacao_id": org_id, "deletado_em": None})
    if not form:
        raise HTTPException(status_code=404, detail="Formulário não encontrado")
    
    responses = await db.form_responses.find({"formulario_id": form_id, "deletado_em": None}).to_list(1000)
    return success_response(data=responses)

# ==================== ALBUMS ====================
@router.post("/albums")
async def create_album(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    album = Album(**data, organizacao_id=org_id, usuario_id=user_id)
    doc = album.model_dump()
    await db.albums.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/albums")
async def list_albums(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    albums = await db.albums.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    
    for album in albums:
        album["midia_count"] = await db.medias.count_documents({"referencia_id": album["id"], "deletado_em": None})
    
    return success_response(data=albums)
