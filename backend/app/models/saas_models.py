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


class LogAcessoMasterBase(BaseModel):
    master_id: str  # FK para UsuariosMaster
    organizacao_acessada_id: str  # FK para Organizacoes
    acao: str
    ip: str


class LogAcessoMaster(LogAcessoMasterBase, BaseSaaSModel):
    pass
