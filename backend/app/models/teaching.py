from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class StudyLevel(str, Enum):
    BASICO = "basico"
    INTERMEDIARIO = "intermediario"
    AVANCADO = "avancado"

class ClassStatus(str, Enum):
    ATIVA = "ativa"
    EM_PAUSA = "em_pausa"
    CONCLUIDA = "concluida"

class ProgressStatus(str, Enum):
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"

class StudyBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    nivel: StudyLevel = StudyLevel.BASICO
    arquivo_url: Optional[str] = None
    escola_id: Optional[str] = None
    status: str = "ativo"

class Study(StudyBase, BaseSaaSModel):
    pass

class SchoolBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    responsavel_id: Optional[str] = None
    departamento_id: Optional[str] = None
    status: str = "ativa"

class School(SchoolBase, BaseSaaSModel):
    pass

class ClassBase(BaseModel):
    nome: str
    escola_id: str
    professor_id: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    status: ClassStatus = ClassStatus.ATIVA

class Class(ClassBase, BaseSaaSModel):
    aluno_count: int = 0

class ClassMemberLink(BaseSaaSModel):
    turma_id: str
    membro_id: str
    data_entrada: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgressBase(BaseModel):
    membro_id: str
    turma_id: Optional[str] = None
    estudo_id: Optional[str] = None
    status: ProgressStatus = ProgressStatus.EM_ANDAMENTO
    nota: Optional[float] = Field(None, ge=0.0, le=10.0)
    frequencia_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    observacao: Optional[str] = None

class Progress(ProgressBase, BaseSaaSModel):
    pass
