from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class MediaType(str, Enum):
    FOTO = "foto"
    VIDEO = "video"
    DOCUMENTO = "documento"
    ARQUIVO = "arquivo"
    FORMULARIO = "formulario"

class MediaBase(BaseModel):
    nome: str
    tipo: MediaType
    caminho: Optional[str] = None
    link_externo: Optional[str] = None
    tamanho_bytes: Optional[int] = None
    hash_arquivo: Optional[str] = None
    modulo_vinculado: Optional[str] = None
    referencia_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    privacidade: str = "interno"  # publico, interno

class Media(MediaBase, BaseSaaSModel):
    usuario_id: str

class FormFieldBase(BaseModel):
    nome: str
    tipo: str  # texto, numero, data, selecao, checkbox
    obrigatorio: bool = False
    ordem: int = 0
    opcoes: List[str] = []

class FormField(FormFieldBase, BaseSaaSModel):
    formulario_id: str

class FormBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    modulo_vinculado: Optional[str] = None
    referencia_id: Optional[str] = None

class Form(FormBase, BaseSaaSModel):
    usuario_id: str
    campos: List[FormField] = []

class FormResponseBase(BaseModel):
    formulario_id: str
    respostas: dict  # {campo_id: valor}

class FormResponse(FormResponseBase, BaseSaaSModel):
    usuario_id: Optional[str] = None
    email_respondente: Optional[str] = None

class AlbumBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    modulo_vinculado: Optional[str] = None
    referencia_id: Optional[str] = None

class Album(AlbumBase, BaseSaaSModel):
    usuario_id: str
    midia_count: int = 0
