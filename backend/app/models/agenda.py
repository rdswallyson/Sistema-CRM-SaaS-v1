from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from .base import BaseSaaSModel

class EventType(str, Enum):
    EVENTO = "evento"
    AVISO = "aviso"
    ANIVERSARIO = "aniversario"
    FINANCEIRO = "financeiro"
    ENSINO = "ensino"

class EventBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    tipo: EventType = EventType.EVENTO
    data_inicio: str  # ISO Format
    data_fim: Optional[str] = None
    local: Optional[str] = None
    pago: bool = False
    valor: float = 0.0
    categoria_id: Optional[str] = None
    departamento_id: Optional[str] = None
    cor: str = "#3b82f6"
    status: str = "confirmado"

class Event(EventBase, BaseSaaSModel):
    inscritos_count: int = 0

class AnnouncementBase(BaseModel):
    titulo: str
    mensagem: str
    prioridade: int = 0  # 0: normal, 1: alta
    fixado: bool = False
    agendado_para: Optional[str] = None
    departamento_id: Optional[str] = None
    grupo_id: Optional[str] = None

class Announcement(AnnouncementBase, BaseSaaSModel):
    pass

class NotificationType(str, Enum):
    EVENTO = "evento"
    PAGAMENTO = "pagamento"
    AVISO = "aviso"
    ANIVERSARIO = "aniversario"
    SISTEMA = "sistema"

class NotificationBase(BaseModel):
    usuario_id: str
    tipo: NotificationType
    titulo: str
    mensagem: str
    link_referencia: Optional[str] = None
    lida: bool = False

class Notification(NotificationBase, BaseSaaSModel):
    pass

class NoteBase(BaseModel):
    titulo: str
    conteudo: str
    cor: str = "#fef08a"
    lembrete_em: Optional[str] = None

class Note(NoteBase, BaseSaaSModel):
    usuario_id: str
