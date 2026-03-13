from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class GroupStatus(str, Enum):
    ATIVO = "ativo"
    ENCERRADO = "encerrado"

class GroupCategoryBase(BaseModel):
    nome: str
    cor: str = "#6366f1"
    status: str = "active"

class GroupCategory(GroupCategoryBase, BaseSaaSModel):
    pass

class GroupBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    categoria_id: Optional[str] = None
    departamento_id: Optional[str] = None
    lider_id: str  # Obrigatório sempre
    filial_id: Optional[str] = None
    status: GroupStatus = GroupStatus.ATIVO
    data_inicio: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria_id: Optional[str] = None
    departamento_id: Optional[str] = None
    lider_id: Optional[str] = None
    filial_id: Optional[str] = None
    status: Optional[GroupStatus] = None
    data_inicio: Optional[str] = None

class Group(GroupBase, BaseSaaSModel):
    membro_count: int = 0

class GroupMemberLink(BaseSaaSModel):
    group_id: str
    member_id: str
    data_vinculo: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
