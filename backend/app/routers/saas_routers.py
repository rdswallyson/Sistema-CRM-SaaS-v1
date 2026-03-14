from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from ..core.security import require_super_admin, get_current_user
from ..core.database import db
from ..core.response import success_response, error_response
from ..models.saas_models import Organizacao, OrganizacaoBase, OrganizacaoStatus, Plano, PlanoBase, PlanoStatus, Assinatura, AssinaturaBase, AssinaturaStatus, ConfiguracoesWhiteLabel, ConfiguracoesWhiteLabelBase, Filial, FilialBase, FilialStatus, UsuarioMaster, UsuarioMasterBase, UsuarioMasterNivel, LogAcessoMaster, LogAcessoMasterBase
from datetime import datetime, timezone, date
import uuid

router = APIRouter(prefix="/saas", tags=["SaaS Admin"])

# ==================== ORGANIZACOES ====================
@router.post("/organizacoes", status_code=status.HTTP_201_CREATED)
async def create_organizacao(data: OrganizacaoBase, current_user: dict = Depends(require_super_admin)):
    existing = await db.organizacoes.find_one({"$or": [{"slug": data.slug}, {"dominio": data.dominio}], "deletado_em": None})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug ou domínio já em uso")
    
    organizacao = Organizacao(**data.model_dump())
    doc = organizacao.model_dump()
    await db.organizacoes.insert_one(doc)
    return success_response(data=doc)

@router.get("/organizacoes")
async def list_organizacoes(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[OrganizacaoStatus] = None,
    current_user: dict = Depends(require_super_admin)
):
    query = {"deletado_em": None}
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"slug": {"$regex": search, "$options": "i"}},
            {"dominio": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    total = await db.organizacoes.count_documents(query)
    organizacoes = await db.organizacoes.find(query).skip(skip).limit(limit).to_list(limit)
    
    meta = {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit
    }
    
    return success_response(data=organizacoes, meta=meta)

@router.get("/organizacoes/{organizacao_id}")
async def get_organizacao(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    organizacao = await db.organizacoes.find_one({"id": organizacao_id, "deletado_em": None})
    if not organizacao:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return success_response(data=organizacao)

@router.put("/organizacoes/{organizacao_id}")
async def update_organizacao(organizacao_id: str, data: OrganizacaoBase, current_user: dict = Depends(require_super_admin)):
    query = {"id": organizacao_id, "deletado_em": None}
    existing = await db.organizacoes.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.organizacoes.update_one(query, {"$set": update_data})
    updated_organizacao = await db.organizacoes.find_one(query)
    return success_response(data=updated_organizacao)

@router.delete("/organizacoes/{organizacao_id}")
async def delete_organizacao(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": organizacao_id, "deletado_em": None}
    result = await db.organizacoes.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return success_response(data={"message": "Organização removida com sucesso"})

# ==================== PLANOS ====================
@router.post("/planos", status_code=status.HTTP_201_CREATED)
async def create_plano(data: PlanoBase, current_user: dict = Depends(require_super_admin)):
    plano = Plano(**data.model_dump())
    doc = plano.model_dump()
    await db.planos.insert_one(doc)
    return success_response(data=doc)

@router.get("/planos")
async def list_planos(current_user: dict = Depends(require_super_admin)):
    planos = await db.planos.find({"deletado_em": None}).to_list(100)
    return success_response(data=planos)

@router.get("/planos/{plano_id}")
async def get_plano(plano_id: str, current_user: dict = Depends(require_super_admin)):
    plano = await db.planos.find_one({"id": plano_id, "deletado_em": None})
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return success_response(data=plano)

@router.put("/planos/{plano_id}")
async def update_plano(plano_id: str, data: PlanoBase, current_user: dict = Depends(require_super_admin)):
    query = {"id": plano_id, "deletado_em": None}
    existing = await db.planos.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.planos.update_one(query, {"$set": update_data})
    updated_plano = await db.planos.find_one(query)
    return success_response(data=updated_plano)

@router.delete("/planos/{plano_id}")
async def delete_plano(plano_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": plano_id, "deletado_em": None}
    result = await db.planos.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return success_response(data={"message": "Plano removido com sucesso"})

# ==================== ASSINATURAS ====================
@router.post("/assinaturas", status_code=status.HTTP_201_CREATED)
async def create_assinatura(data: AssinaturaBase, current_user: dict = Depends(require_super_admin)):
    assinatura = Assinatura(**data.model_dump())
    doc = assinatura.model_dump()
    await db.assinaturas.insert_one(doc)
    return success_response(data=doc)

@router.get("/assinaturas")
async def list_assinaturas(
    organizacao_id: Optional[str] = None,
    status: Optional[AssinaturaStatus] = None,
    current_user: dict = Depends(require_super_admin)
):
    query = {"deletado_em": None}
    if organizacao_id:
        query["organizacao_id"] = organizacao_id
    if status:
        query["status"] = status
    
    assinaturas = await db.assinaturas.find(query).to_list(100)
    return success_response(data=assinaturas)

@router.get("/assinaturas/{assinatura_id}")
async def get_assinatura(assinatura_id: str, current_user: dict = Depends(require_super_admin)):
    assinatura = await db.assinaturas.find_one({"id": assinatura_id, "deletado_em": None})
    if not assinatura:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    return success_response(data=assinatura)

@router.put("/assinaturas/{assinatura_id}")
async def update_assinatura(assinatura_id: str, data: AssinaturaBase, current_user: dict = Depends(require_super_admin)):
    query = {"id": assinatura_id, "deletado_em": None}
    existing = await db.assinaturas.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.assinaturas.update_one(query, {"$set": update_data})
    updated_assinatura = await db.assinaturas.find_one(query)
    return success_response(data=updated_assinatura)

@router.delete("/assinaturas/{assinatura_id}")
async def delete_assinatura(assinatura_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": assinatura_id, "deletado_em": None}
    result = await db.assinaturas.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    return success_response(data={"message": "Assinatura removida com sucesso"})

# ==================== CONFIGURACOES WHITE LABEL ====================
@router.post("/white-label", status_code=status.HTTP_201_CREATED)
async def create_white_label_config(data: ConfiguracoesWhiteLabelBase, current_user: dict = Depends(require_super_admin)):
    existing = await db.configuracoes_white_label.find_one({"organizacao_id": data.organizacao_id, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Configuração de White Label já existe para esta organização")
    
    config = ConfiguracoesWhiteLabel(**data.model_dump())
    doc = config.model_dump()
    await db.configuracoes_white_label.insert_one(doc)
    return success_response(data=doc)

@router.get("/white-label/{organizacao_id}")
async def get_white_label_config(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    config = await db.configuracoes_white_label.find_one({"organizacao_id": organizacao_id, "deletado_em": None})
    if not config:
        raise HTTPException(status_code=404, detail="Configuração de White Label não encontrada")
    return success_response(data=config)

@router.put("/white-label/{organizacao_id}")
async def update_white_label_config(organizacao_id: str, data: ConfiguracoesWhiteLabelBase, current_user: dict = Depends(require_super_admin)):
    query = {"organizacao_id": organizacao_id, "deletado_em": None}
    existing = await db.configuracoes_white_label.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Configuração de White Label não encontrada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.configuracoes_white_label.update_one(query, {"$set": update_data})
    updated_config = await db.configuracoes_white_label.find_one(query)
    return success_response(data=updated_config)

# ==================== FILIAIS ====================
@router.post("/filiais", status_code=status.HTTP_201_CREATED)
async def create_filial(data: FilialBase, current_user: dict = Depends(require_super_admin)):
    filial = Filial(**data.model_dump())
    doc = filial.model_dump()
    await db.filiais.insert_one(doc)
    return success_response(data=doc)

@router.get("/filiais")
async def list_filiais(
    organizacao_id: Optional[str] = None,
    status: Optional[FilialStatus] = None,
    current_user: dict = Depends(require_super_admin)
):
    query = {"deletado_em": None}
    if organizacao_id:
        query["organizacao_id"] = organizacao_id
    if status:
        query["status"] = status
    
    filiais = await db.filiais.find(query).to_list(100)
    return success_response(data=filiais)

@router.get("/filiais/{filial_id}")
async def get_filial(filial_id: str, current_user: dict = Depends(require_super_admin)):
    filial = await db.filiais.find_one({"id": filial_id, "deletado_em": None})
    if not filial:
        raise HTTPException(status_code=404, detail="Filial não encontrada")
    return success_response(data=filial)

@router.put("/filiais/{filial_id}")
async def update_filial(filial_id: str, data: FilialBase, current_user: dict = Depends(require_super_admin)):
    query = {"id": filial_id, "deletado_em": None}
    existing = await db.filiais.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Filial não encontrada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.filiais.update_one(query, {"$set": update_data})
    updated_filial = await db.filiais.find_one(query)
    return success_response(data=updated_filial)

@router.delete("/filiais/{filial_id}")
async def delete_filial(filial_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": filial_id, "deletado_em": None}
    result = await db.filiais.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Filial não encontrada")
    return success_response(data={"message": "Filial removida com sucesso"})

# ==================== USUARIOS MASTER ====================
@router.post("/usuarios-master", status_code=status.HTTP_201_CREATED)
async def create_usuario_master(data: UsuarioMasterBase, current_user: dict = Depends(require_super_admin)):
    existing = await db.usuarios_master.find_one({"email": data.email, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado para usuário master")
    
    usuario_master = UsuarioMaster(**data.model_dump())
    doc = usuario_master.model_dump()
    await db.usuarios_master.insert_one(doc)
    return success_response(data=doc)

@router.get("/usuarios-master")
async def list_usuarios_master(
    nivel: Optional[UsuarioMasterNivel] = None,
    ativo: Optional[bool] = None,
    current_user: dict = Depends(require_super_admin)
):
    query = {"deletado_em": None}
    if nivel:
        query["nivel"] = nivel
    if ativo is not None:
        query["ativo"] = ativo
    
    usuarios = await db.usuarios_master.find(query).to_list(100)
    return success_response(data=usuarios)

@router.get("/usuarios-master/{master_id}")
async def get_usuario_master(master_id: str, current_user: dict = Depends(require_super_admin)):
    usuario = await db.usuarios_master.find_one({"id": master_id, "deletado_em": None})
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário Master não encontrado")
    return success_response(data=usuario)

@router.put("/usuarios-master/{master_id}")
async def update_usuario_master(master_id: str, data: UsuarioMasterBase, current_user: dict = Depends(require_super_admin)):
    query = {"id": master_id, "deletado_em": None}
    existing = await db.usuarios_master.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Usuário Master não encontrado")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    
    await db.usuarios_master.update_one(query, {"$set": update_data})
    updated_usuario = await db.usuarios_master.find_one(query)
    return success_response(data=updated_usuario)

@router.delete("/usuarios-master/{master_id}")
async def delete_usuario_master(master_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": master_id, "deletado_em": None}
    result = await db.usuarios_master.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário Master não encontrado")
    return success_response(data={"message": "Usuário Master removido com sucesso"})

# ==================== LOGS ACESSO MASTER ====================
@router.post("/logs-acesso-master", status_code=status.HTTP_201_CREATED)
async def create_log_acesso_master(data: LogAcessoMasterBase, current_user: dict = Depends(require_super_admin)):
    log = LogAcessoMaster(**data.model_dump())
    doc = log.model_dump()
    await db.logs_acesso_master.insert_one(doc)
    return success_response(data=doc)

@router.get("/logs-acesso-master")
async def list_logs_acesso_master(
    master_id: Optional[str] = None,
    organizacao_acessada_id: Optional[str] = None,
    current_user: dict = Depends(require_super_admin)
):
    query = {"deletado_em": None}
    if master_id:
        query["master_id"] = master_id
    if organizacao_acessada_id:
        query["organizacao_acessada_id"] = organizacao_acessada_id
    
    logs = await db.logs_acesso_master.find(query).sort("criado_em", -1).to_list(100)
    return success_response(data=logs)

@router.get("/logs-acesso-master/{log_id}")
async def get_log_acesso_master(log_id: str, current_user: dict = Depends(require_super_admin)):
    log = await db.logs_acesso_master.find_one({"id": log_id, "deletado_em": None})
    if not log:
        raise HTTPException(status_code=404, detail="Log de Acesso Master não encontrado")
    return success_response(data=log)

# ==================== ENDPOINTS DE ADMIN MASTER ====================
@router.post("/admin/acessar-organizacao/{organizacao_id}")
async def access_organizacao_as_admin(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    organizacao = await db.organizacoes.find_one({"id": organizacao_id, "deletado_em": None})
    if not organizacao:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Generate a temporary token for the super admin to access the organization as an admin
    temp_token = create_token(
        user_id=current_user["user_id"],
        email=current_user["email"],
        role=UserRole.ADMIN_CHURCH, # Access as church admin
        organizacao_id=organizacao_id
    )
    
    # Log the access
    log_data = LogAcessoMasterBase(
        master_id=current_user["user_id"],
        organizacao_acessada_id=organizacao_id,
        acao=f"Acesso como admin à organização {organizacao['nome']}",
        ip="0.0.0.0" # TODO: Get actual IP
    )
    log = LogAcessoMaster(**log_data.model_dump())
    await db.logs_acesso_master.insert_one(log.model_dump())
    
    return success_response(data={"access_token": temp_token, "message": f"Acesso concedido como admin à organização {organizacao['nome']}"})

@router.post("/admin/suspender-organizacao/{organizacao_id}")
async def suspend_organizacao(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": organizacao_id, "deletado_em": None}
    organizacao = await db.organizacoes.find_one(query)
    if not organizacao:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    await db.organizacoes.update_one(query, {"$set": {"status": OrganizacaoStatus.SUSPENSA, "atualizado_em": datetime.now(timezone.utc)}})
    
    # Log the action
    log_data = LogAcessoMasterBase(
        master_id=current_user["user_id"],
        organizacao_acessada_id=organizacao_id,
        acao=f"Organização {organizacao['nome']} suspensa",
        ip="0.0.0.0" # TODO: Get actual IP
    )
    log = LogAcessoMaster(**log_data.model_dump())
    await db.logs_acesso_master.insert_one(log.model_dump())
    
    return success_response(data={"message": f"Organização {organizacao['nome']} suspensa com sucesso"})

@router.post("/admin/ativar-organizacao/{organizacao_id}")
async def activate_organizacao(organizacao_id: str, current_user: dict = Depends(require_super_admin)):
    query = {"id": organizacao_id, "deletado_em": None}
    organizacao = await db.organizacoes.find_one(query)
    if not organizacao:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    await db.organizacoes.update_one(query, {"$set": {"status": OrganizacaoStatus.ATIVA, "atualizado_em": datetime.now(timezone.utc)}})
    
    # Log the action
    log_data = LogAcessoMasterBase(
        master_id=current_user["user_id"],
        organizacao_acessada_id=organizacao_id,
        acao=f"Organização {organizacao['nome']} ativada",
        ip="0.0.0.0" # TODO: Get actual IP
    )
    log = LogAcessoMaster(**log_data.model_dump())
    await db.logs_acesso_master.insert_one(log.model_dump())
    
    return success_response(data={"message": f"Organização {organizacao['nome']} ativada com sucesso"})

@router.post("/admin/alterar-plano/{organizacao_id}/{plano_id}")
async def change_organizacao_plan(organizacao_id: str, plano_id: str, current_user: dict = Depends(require_super_admin)):
    organizacao = await db.organizacoes.find_one({"id": organizacao_id, "deletado_em": None})
    if not organizacao:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    plano = await db.planos.find_one({"id": plano_id, "deletado_em": None})
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    await db.organizacoes.update_one({"id": organizacao_id}, {"$set": {"plano_id": plano_id, "atualizado_em": datetime.now(timezone.utc)}})
    
    # Log the action
    log_data = LogAcessoMasterBase(
        master_id=current_user["user_id"],
        organizacao_acessada_id=organizacao_id,
        acao=f"Plano da organização {organizacao['nome']} alterado para {plano['nome']}",
        ip="0.0.0.0" # TODO: Get actual IP
    )
    log = LogAcessoMaster(**log_data.model_dump())
    await db.logs_acesso_master.insert_one(log.model_dump())
    
    return success_response(data={"message": f"Plano da organização {organizacao['nome']} alterado para {plano['nome']} com sucesso"})
