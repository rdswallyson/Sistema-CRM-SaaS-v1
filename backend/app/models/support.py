from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class TicketPriority(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"

class TicketStatus(str, Enum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    AGUARDANDO = "aguardando"
    RESOLVIDO = "resolvido"
    FECHADO = "fechado"

class TicketBase(BaseModel):
    usuario_id: str
    titulo: str
    descricao: str
    categoria: str
    prioridade: TicketPriority = TicketPriority.MEDIA
    status: TicketStatus = TicketStatus.ABERTO
    anexos: List[str] = []
    data_abertura: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data_resolucao: Optional[datetime] = None

class Ticket(TicketBase, BaseSaaSModel):
    pass

class TicketMessageBase(BaseModel):
    ticket_id: str
    usuario_id: str
    mensagem: str
    anexos: List[str] = []
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketMessage(TicketMessageBase, BaseSaaSModel):
    pass

class SLAConfigBase(BaseModel):
    prioridade: TicketPriority
    tempo_primeira_resposta_min: int
    tempo_resolucao_min: int

class SLAConfig(SLAConfigBase, BaseSaaSModel):
    pass

class TutorialBase(BaseModel):
    titulo: str
    conteudo: str
    categoria: str
    video_url: Optional[str] = None
    anexos: List[str] = []

class Tutorial(TutorialBase, BaseSaaSModel):
    pass

class KnowledgeBaseBase(BaseModel):
    titulo: str
    conteudo: str
    categoria: str
    tags: List[str] = []

class KnowledgeBase(KnowledgeBaseBase, BaseSaaSModel):
    pass
