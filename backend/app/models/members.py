from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class MemberStatus(str, Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    SUSPENSO = "suspenso"
    VISITANTE = "visitante"

class MemberBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: str
    email: Optional[EmailStr] = None
    data_nascimento: Optional[str] = None
    cargo_id: Optional[str] = None
    categoria_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None
    status: MemberStatus = MemberStatus.ATIVO
    foto_url: Optional[str] = None
    observacoes: Optional[str] = None
    campos_personalizados: Dict[str, Any] = {}

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    data_nascimento: Optional[str] = None
    cargo_id: Optional[str] = None
    categoria_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None
    status: Optional[MemberStatus] = None
    foto_url: Optional[str] = None
    observacoes: Optional[str] = None
    campos_personalizados: Optional[Dict[str, Any]] = None

class Member(MemberBase, BaseSaaSModel):
    pass

class CustomFieldType(str, Enum):
    TEXTO = "texto"
    NUMERO = "numero"
    DATA = "data"
    SELECAO = "selecao"
    CHECKBOX = "checkbox"
    TEXTAREA = "textarea"

class CustomFieldBase(BaseModel):
    nome: str
    tipo: CustomFieldType
    obrigatorio: bool = False
    ativo: bool = True
    ordem: int = 0
    opcoes: List[str] = []

class CustomField(CustomFieldBase, BaseSaaSModel):
    pass

class MemberCategoryBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    cor: str = "#3b82f6"

class MemberCategory(MemberCategoryBase, BaseSaaSModel):
    pass

class MemberPositionBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    nivel_hierarquico: int = 0

class MemberPosition(MemberPositionBase, BaseSaaSModel):
    pass

class PositionHistoryBase(BaseModel):
    membro_id: str
    cargo_id: str
    data_inicio: str
    data_fim: Optional[str] = None
    ativo: bool = True

class PositionHistory(PositionHistoryBase, BaseSaaSModel):
    pass

class DigitalCardBase(BaseModel):
    membro_id: str
    qr_code_hash: str
    qr_code_url: Optional[str] = None
    ativo: bool = True

class DigitalCard(DigitalCardBase, BaseSaaSModel):
    pass

class MenuPersonalizationBase(BaseModel):
    modulo: str
    chave_menu: str
    nome_exibicao: str

class MenuPersonalization(MenuPersonalizationBase, BaseSaaSModel):
    atualizado_por: str
