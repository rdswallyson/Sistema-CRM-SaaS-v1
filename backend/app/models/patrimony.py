from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone, date
from enum import Enum
from .base import BaseSaaSModel

class PatrimonyStatus(str, Enum):
    ATIVO = "ativo"
    EM_MANUTENCAO = "em_manutencao"
    BAIXADO = "baixado"

class MaintenanceType(str, Enum):
    PREVENTIVA = "preventiva"
    CORRETIVA = "corretiva"

class PatrimonyCategoryBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class PatrimonyCategory(PatrimonyCategoryBase, BaseSaaSModel):
    pass

class PatrimonyLocationBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class PatrimonyLocation(PatrimonyLocationBase, BaseSaaSModel):
    pass

class PatrimonyBase(BaseModel):
    nome: str
    codigo_interno: Optional[str] = None
    categoria_id: Optional[str] = None
    local_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None
    valor_aquisicao: Optional[float] = None
    data_aquisicao: Optional[date] = None
    fornecedor_id: Optional[str] = None
    status: PatrimonyStatus = PatrimonyStatus.ATIVO
    fotos: List[str] = []

class Patrimony(PatrimonyBase, BaseSaaSModel):
    pass

class PatrimonyMovementBase(BaseModel):
    patrimonio_id: str
    local_origem_id: Optional[str] = None
    local_destino_id: str
    departamento_origem_id: Optional[str] = None
    departamento_destino_id: Optional[str] = None
    motivo: Optional[str] = None
    data_movimentacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    usuario_id: str

class PatrimonyMovement(PatrimonyMovementBase, BaseSaaSModel):
    pass

class PatrimonyMaintenanceBase(BaseModel):
    patrimonio_id: str
    tipo: MaintenanceType
    custo: Optional[float] = None
    data: date
    descricao: Optional[str] = None
    transacao_financeira_id: Optional[str] = None

class PatrimonyMaintenance(PatrimonyMaintenanceBase, BaseSaaSModel):
    pass
