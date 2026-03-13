from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class DepartmentStatus(str, Enum):
    ATIVO = "ativo"
    ARQUIVADO = "arquivado"

class DepartmentBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    icone: str = "building"
    responsavel_id: Optional[str] = None
    filial_id: Optional[str] = None
    status: DepartmentStatus = DepartmentStatus.ATIVO
    objetivos: Optional[str] = None
    horario_reuniao: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    icone: Optional[str] = None
    responsavel_id: Optional[str] = None
    filial_id: Optional[str] = None
    status: Optional[DepartmentStatus] = None
    objetivos: Optional[str] = None
    horario_reuniao: Optional[str] = None

class Department(DepartmentBase, BaseSaaSModel):
    membro_count: int = 0

class DepartmentMemberLink(BaseSaaSModel):
    department_id: str
    member_id: str
    data_vinculo: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
