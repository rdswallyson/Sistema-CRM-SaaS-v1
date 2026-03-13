from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone, date
from enum import Enum
from .base import BaseSaaSModel

class TransactionType(str, Enum):
    RECEITA = "receita"
    DESPESA = "despesa"
    TRANSFERENCIA = "transferencia"

class TransactionStatus(str, Enum):
    PENDENTE = "pendente"
    CONFIRMADO = "confirmado"
    CANCELADO = "cancelado"

class AccountType(str, Enum):
    CAIXA = "caixa"
    BANCO = "banco"
    CARTEIRA_DIGITAL = "carteira_digital"

class AccountBase(BaseModel):
    nome: str
    tipo: AccountType = AccountType.BANCO
    saldo_inicial: float = 0.0
    status: str = "active"

class Account(AccountBase, BaseSaaSModel):
    saldo_atual: float = 0.0

class TransactionBase(BaseModel):
    tipo: TransactionType
    valor: float = Field(..., gt=0)
    data: str  # Format YYYY-MM-DD
    conta_id: str
    categoria_id: str
    centro_custo_id: Optional[str] = None
    contato_id: Optional[str] = None
    descricao: Optional[str] = None
    status: TransactionStatus = TransactionStatus.PENDENTE
    estorno_de_id: Optional[str] = None

class Transaction(TransactionBase, BaseSaaSModel):
    criado_por: str

class FinancialLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organizacao_id: str
    usuario_id: str
    transacao_id: Optional[str] = None
    acao: str  # criar, editar, estornar, confirmar
    dados_antes: Optional[Dict[str, Any]] = None
    dados_depois: Optional[Dict[str, Any]] = None
    ip_origem: str
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LockPeriodBase(BaseModel):
    mes: int = Field(..., ge=1, le=12)
    ano: int
    bloqueado: bool = True
    bloqueado_por: str

class LockPeriod(LockPeriodBase, BaseSaaSModel):
    pass
