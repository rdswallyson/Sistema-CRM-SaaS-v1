from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
from enum import Enum
from .base import BaseSaaSModel


class OrganizacaoStatus(str, Enum):
    ATIVA = "ativa"
    SUSPENSA = "suspensa"
    CANCELADA = "cancelada"


class OrganizacaoBase(BaseModel):
    nome: str
    slug: str
    dominio: Optional[str] = None
    plano_id: Optional[str] = None  # FK para Planos
    status: OrganizacaoStatus = OrganizacaoStatus.ATIVA


class Organizacao(OrganizacaoBase, BaseSaaSModel):
    pass


class OrganizacaoCreate(BaseModel):
    nome: str
    slug: Optional[str] = None
    status: OrganizacaoStatus = OrganizacaoStatus.ATIVA
    plano_id: Optional[str] = None


class OrganizacaoUpdate(BaseModel):
    nome: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[OrganizacaoStatus] = None
    plano_id: Optional[str] = None


class PlanoStatus(str, Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"


class PlanoBase(BaseModel):
    nome: str
    preco_mensal: float
    limite_membros: int
    limite_eventos: int
    limite_armazenamento_gb: int
    recursos_ativos: Dict[str, Any]
    status: PlanoStatus = PlanoStatus.ATIVO


class Plano(PlanoBase, BaseSaaSModel):
    pass


class PlanoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    preco_mensal: float = 0.0
    preco_anual: float = 0.0
    limite_membros: int = 100
    limite_eventos: int = 50
    limite_armazenamento_gb: int = 5
    recursos_ativos: Optional[Dict[str, Any]] = None
    status: PlanoStatus = PlanoStatus.ATIVO


class PlanoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    preco_mensal: Optional[float] = None
    preco_anual: Optional[float] = None
    limite_membros: Optional[int] = None
    limite_eventos: Optional[int] = None
    limite_armazenamento_gb: Optional[int] = None
    recursos_ativos: Optional[Dict[str, Any]] = None
    status: Optional[PlanoStatus] = None


class AssinaturaStatus(str, Enum):
    ATIVA = "ativa"
    SUSPENSA = "suspensa"
    CANCELADA = "cancelada"


class AssinaturaBase(BaseModel):
    organizacao_id: str  # FK para Organizacoes
    plano_id: str  # FK para Planos
    status: AssinaturaStatus = AssinaturaStatus.ATIVA
    data_inicio: date
    data_fim: Optional[date] = None
    renovacao_automatica: bool = True
    gateway_subscription_id: Optional[str] = None


class Assinatura(AssinaturaBase, BaseSaaSModel):
    pass


class AssinaturaCreate(BaseModel):
    organizacao_id: str
    plano_id: str
    status: AssinaturaStatus = AssinaturaStatus.ATIVA


class AssinaturaUpdate(BaseModel):
    plano_id: Optional[str] = None
    status: Optional[AssinaturaStatus] = None


class ConfiguracoesWhiteLabelBase(BaseModel):
    organizacao_id: str  # PK, FK 1:1 com Organizacoes
    nome_sistema: str
    logo_url: Optional[str] = None
    cor_primaria: str = "#0F2942"
    cor_secundaria: str = "#1A6B3C"
    dominio_personalizado: Optional[str] = None


class ConfiguracoesWhiteLabel(ConfiguracoesWhiteLabelBase, BaseSaaSModel):
    pass


class FilialStatus(str, Enum):
    ATIVA = "ativa"
    INATIVA = "inativa"


class FilialBase(BaseModel):
    organizacao_id: str  # FK para Organizacoes
    nome: str
    cidade: Optional[str] = None
    estado: Optional[str] = None
    responsavel_id: Optional[str] = None  # FK para Membros
    status: FilialStatus = FilialStatus.ATIVA


class Filial(FilialBase, BaseSaaSModel):
    pass


class UsuarioMasterNivel(str, Enum):
    SUPER_ADMIN = "super_admin"
    SUPORTE = "suporte"


class UsuarioMasterBase(BaseModel):
    nome: str
    email: EmailStr
    senha_hash: str
    nivel: UsuarioMasterNivel
    ativo: bool = True


class UsuarioMaster(UsuarioMasterBase, BaseSaaSModel):
    pass


class UsuarioMasterCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    nivel: UsuarioMasterNivel = UsuarioMasterNivel.SUPORTE


class UsuarioMasterUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    nivel: Optional[UsuarioMasterNivel] = None
    ativo: Optional[bool] = None


class LogAcessoMasterBase(BaseModel):
    master_id: str  # FK para UsuariosMaster
    organizacao_acessada_id: str  # FK para Organizacoes
    acao: str
    ip: str


class LogAcessoMaster(LogAcessoMasterBase, BaseSaaSModel):
    pass
