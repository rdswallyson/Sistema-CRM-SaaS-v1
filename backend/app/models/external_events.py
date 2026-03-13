from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class TicketStatus(str, Enum):
    VALIDO = "valido"
    UTILIZADO = "utilizado"
    CANCELADO = "cancelado"

class PaymentStatus(str, Enum):
    PENDENTE = "pendente"
    APROVADO = "aprovado"
    REJEITADO = "rejeitado"
    ESTORNADO = "estornado"

class PaymentMethod(str, Enum):
    PIX = "pix"
    CREDITO = "credito"
    DEBITO = "debito"

class ExternalEventBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    slug: str
    data_inicio: str
    data_fim: Optional[str] = None
    local: str
    imagem_url: Optional[str] = None
    valor: float = 0.0
    capacidade_maxima: Optional[int] = None
    status: str = "ativo"
    cor_primaria: str = "#3b82f6"
    cor_secundaria: str = "#1e40af"

class ExternalEvent(ExternalEventBase, BaseSaaSModel):
    inscricoes_count: int = 0

class RegistrationBase(BaseModel):
    evento_id: str
    nome: str
    email: EmailStr
    telefone: str
    membro_id: Optional[str] = None
    visitante: bool = False

class Registration(RegistrationBase, BaseSaaSModel):
    status: str = "pendente"

class TicketBase(BaseModel):
    evento_id: str
    inscricao_id: str
    codigo_unico: str
    qr_hash: str
    qr_code_url: Optional[str] = None
    status: TicketStatus = TicketStatus.VALIDO

class Ticket(TicketBase, BaseSaaSModel):
    emitido_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceBase(BaseModel):
    ingresso_id: str
    usuario_checkin_id: str

class Attendance(AttendanceBase, BaseSaaSModel):
    data_checkin: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GatewayPaymentBase(BaseModel):
    inscricao_id: str
    gateway_id_externo: str
    metodo: PaymentMethod
    valor: float
    status: PaymentStatus = PaymentStatus.PENDENTE
    webhook_payload: Optional[dict] = None

class GatewayPayment(GatewayPaymentBase, BaseSaaSModel):
    pass
