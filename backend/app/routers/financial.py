from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, UserRole
from ..core.database import db, client
from ..core.response import success_response, error_response
from ..models.financial import Transaction, TransactionBase, TransactionType, TransactionStatus, Account, AccountBase, AccountType, LockPeriod, LockPeriodBase, FinancialLog
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/church/financial", tags=["Financeiro"])

async def check_period_locked(org_id: str, date_str: str):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        locked = await db.lock_periods.find_one({
            "organizacao_id": org_id,
            "mes": dt.month,
            "ano": dt.year,
            "bloqueado": True,
            "deletado_em": None
        })
        if locked:
            raise HTTPException(status_code=403, detail=f"O período {dt.month}/{dt.year} está bloqueado para alterações.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM-DD.")

async def log_financial_action(request: Request, org_id: str, user_id: str, action: str, trans_id: str = None, before: dict = None, after: dict = None):
    log = {
        "id": str(uuid.uuid4()),
        "organizacao_id": org_id,
        "usuario_id": user_id,
        "transacao_id": trans_id,
        "acao": action,
        "dados_antes": before,
        "dados_depois": after,
        "ip_origem": request.client.host if request.client else "unknown",
        "criado_em": datetime.now(timezone.utc)
    }
    await db.financial_logs.insert_one(log)

# ==================== CONTAS ====================
# Alias: frontend usa /church/fin/contas, backend usa /church/financial/contas
fin_router = APIRouter(prefix="/church/fin", tags=["Financeiro (alias)"])

@router.get("/contas")
@router.get("/contas/")
@fin_router.get("/contas")
@fin_router.get("/contas/")
async def list_contas(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    contas = await db.accounts.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=contas)

@router.post("/contas", status_code=status.HTTP_201_CREATED)
@router.post("/contas/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/contas", status_code=status.HTTP_201_CREATED)
@fin_router.post("/contas/", status_code=status.HTTP_201_CREATED)
async def create_conta(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    conta = Account(
        nome=data["nome"],
        tipo=data.get("tipo", AccountType.BANCO),
        saldo_inicial=data.get("saldo_inicial", 0.0),
        saldo_atual=data.get("saldo_inicial", 0.0),
        status=data.get("status", "active"),
        organizacao_id=org_id
    )
    doc = conta.model_dump()
    await db.accounts.insert_one(doc)
    return success_response(data=doc)

@router.put("/contas/{conta_id}")
@fin_router.put("/contas/{conta_id}")
async def update_conta(conta_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": conta_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.accounts.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.accounts.update_one(query, {"$set": update_data})
    updated = await db.accounts.find_one(query)
    return success_response(data=updated)

@router.delete("/contas/{conta_id}")
@fin_router.delete("/contas/{conta_id}")
async def delete_conta(conta_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": conta_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.accounts.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return success_response(data={"message": "Conta removida com sucesso"})

# ==================== CATEGORIAS ====================
@router.get("/categorias")
@router.get("/categorias/")
@fin_router.get("/categorias")
@fin_router.get("/categorias/")
async def list_categorias(
    tipo: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if tipo:
        query["tipo"] = tipo
    categorias = await db.financial_categories.find(query).sort("nome", 1).to_list(200)
    return success_response(data=categorias)

@router.post("/categorias", status_code=status.HTTP_201_CREATED)
@router.post("/categorias/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/categorias", status_code=status.HTTP_201_CREATED)
@fin_router.post("/categorias/", status_code=status.HTTP_201_CREATED)
async def create_categoria(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    categoria = {
        "id": str(uuid.uuid4()),
        "nome": data["nome"],
        "tipo": data.get("tipo", "receita"),
        "descricao": data.get("descricao"),
        "cor": data.get("cor", "#6b7280"),
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.financial_categories.insert_one(categoria)
    return success_response(data=categoria)

@router.put("/categorias/{categoria_id}")
@fin_router.put("/categorias/{categoria_id}")
async def update_categoria(categoria_id: str, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": categoria_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.financial_categories.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.financial_categories.update_one(query, {"$set": update_data})
    updated = await db.financial_categories.find_one(query)
    return success_response(data=updated)

@router.delete("/categorias/{categoria_id}")
@fin_router.delete("/categorias/{categoria_id}")
async def delete_categoria(categoria_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    query = {"id": categoria_id, "organizacao_id": org_id, "deletado_em": None}
    result = await db.financial_categories.update_one(query, {"$set": {"deletado_em": datetime.now(timezone.utc)}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return success_response(data={"message": "Categoria removida com sucesso"})

# ==================== CENTROS DE CUSTO ====================
@router.get("/centros-custo")
@router.get("/centros-custo/")
@fin_router.get("/centros-custo")
@fin_router.get("/centros-custo/")
async def list_centros_custo(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    centros = await db.cost_centers.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(100)
    return success_response(data=centros)

@router.post("/centros-custo", status_code=status.HTTP_201_CREATED)
@router.post("/centros-custo/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/centros-custo", status_code=status.HTTP_201_CREATED)
@fin_router.post("/centros-custo/", status_code=status.HTTP_201_CREATED)
async def create_centro_custo(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    centro = {
        "id": str(uuid.uuid4()),
        "nome": data["nome"],
        "descricao": data.get("descricao"),
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.cost_centers.insert_one(centro)
    return success_response(data=centro)

# ==================== CONTATOS FINANCEIROS ====================
@router.get("/contatos")
@router.get("/contatos/")
@fin_router.get("/contatos")
@fin_router.get("/contatos/")
async def list_contatos(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    contatos = await db.financial_contacts.find({"organizacao_id": org_id, "deletado_em": None}).sort("nome", 1).to_list(200)
    return success_response(data=contatos)

@router.post("/contatos", status_code=status.HTTP_201_CREATED)
@router.post("/contatos/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/contatos", status_code=status.HTTP_201_CREATED)
@fin_router.post("/contatos/", status_code=status.HTTP_201_CREATED)
async def create_contato(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    contato = {
        "id": str(uuid.uuid4()),
        "nome": data["nome"],
        "tipo": data.get("tipo", "pessoa_fisica"),
        "cpf_cnpj": data.get("cpf_cnpj"),
        "email": data.get("email"),
        "telefone": data.get("telefone"),
        "organizacao_id": org_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.financial_contacts.insert_one(contato)
    return success_response(data=contato)

# ==================== TRANSAÇÕES ====================
@router.get("/transacoes")
@router.get("/transacoes/")
@fin_router.get("/transacoes")
@fin_router.get("/transacoes/")
async def list_transacoes(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    tipo: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    conta_id: Optional[str] = None,
    categoria_id: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    query = {"organizacao_id": org_id, "deletado_em": None}
    if tipo:
        query["tipo"] = tipo
    if status_filter:
        query["status"] = status_filter
    if conta_id:
        query["conta_id"] = conta_id
    if categoria_id:
        query["categoria_id"] = categoria_id
    if data_inicio:
        query.setdefault("data", {})["$gte"] = data_inicio
    if data_fim:
        query.setdefault("data", {})["$lte"] = data_fim

    skip = (page - 1) * limit
    total = await db.transactions.count_documents(query)
    transacoes = await db.transactions.find(query).sort("data", -1).skip(skip).limit(limit).to_list(limit)
    
    meta = {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    return success_response(data=transacoes, meta=meta)

@router.post("/transacoes", status_code=status.HTTP_201_CREATED)
@router.post("/transacoes/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/transacoes", status_code=status.HTTP_201_CREATED)
@fin_router.post("/transacoes/", status_code=status.HTTP_201_CREATED)
async def create_transacao(request: Request, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    if data.get("data"):
        await check_period_locked(org_id, data["data"])
    
    if data.get("conta_id"):
        account = await db.accounts.find_one({"id": data["conta_id"], "organizacao_id": org_id, "deletado_em": None})
        if not account:
            raise HTTPException(status_code=404, detail="Conta financeira não encontrada")
    
    trans = {
        "id": str(uuid.uuid4()),
        "organizacao_id": org_id,
        "tipo": data["tipo"],
        "valor": data["valor"],
        "data": data.get("data", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "conta_id": data.get("conta_id"),
        "categoria_id": data.get("categoria_id"),
        "centro_custo_id": data.get("centro_custo_id"),
        "contato_id": data.get("contato_id"),
        "descricao": data.get("descricao"),
        "status": data.get("status", TransactionStatus.PENDENTE),
        "estorno_de_id": data.get("estorno_de_id"),
        "criado_por": user_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    
    await db.transactions.insert_one(trans)
    
    # Update balance if confirmed
    if trans["status"] == TransactionStatus.CONFIRMADO and trans.get("conta_id"):
        adj = trans["valor"] if trans["tipo"] == TransactionType.RECEITA else -trans["valor"]
        await db.accounts.update_one(
            {"id": trans["conta_id"]},
            {"$inc": {"saldo_atual": adj}}
        )
    
    await log_financial_action(request, org_id, user_id, "criar", trans["id"], None, trans)
    return success_response(data=trans)

@router.get("/transacoes/{trans_id}")
@fin_router.get("/transacoes/{trans_id}")
async def get_transacao(trans_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    trans = await db.transactions.find_one({"id": trans_id, "organizacao_id": org_id, "deletado_em": None})
    if not trans:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return success_response(data=trans)

@router.put("/transacoes/{trans_id}")
@fin_router.put("/transacoes/{trans_id}")
async def update_transacao(trans_id: str, request: Request, data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    query = {"id": trans_id, "organizacao_id": org_id, "deletado_em": None}
    existing = await db.transactions.find_one(query)
    if not existing:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if existing.get("status") == TransactionStatus.CONFIRMADO:
        raise HTTPException(status_code=400, detail="Transações confirmadas não podem ser editadas. Use o estorno.")
    
    update_data = {k: v for k, v in data.items() if v is not None}
    update_data["atualizado_em"] = datetime.now(timezone.utc)
    await db.transactions.update_one(query, {"$set": update_data})
    updated = await db.transactions.find_one(query)
    await log_financial_action(request, org_id, user_id, "editar", trans_id, existing, updated)
    return success_response(data=updated)

@router.post("/transactions/{trans_id}/reverse")
@fin_router.post("/transacoes/{trans_id}/estorno")
async def reverse_transaction(request: Request, trans_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    original = await db.transactions.find_one({"id": trans_id, "organizacao_id": org_id, "deletado_em": None})
    if not original:
        raise HTTPException(status_code=404, detail="Transação original não encontrada")
    
    if original["status"] != TransactionStatus.CONFIRMADO:
        raise HTTPException(status_code=400, detail="Apenas transações confirmadas podem ser estornadas")
        
    await check_period_locked(org_id, original["data"])
    
    rev_type = TransactionType.DESPESA if original["tipo"] == TransactionType.RECEITA else TransactionType.RECEITA
    rev_trans = {
        "id": str(uuid.uuid4()),
        "organizacao_id": org_id,
        "tipo": rev_type,
        "valor": original["valor"],
        "data": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "conta_id": original.get("conta_id"),
        "categoria_id": original.get("categoria_id"),
        "descricao": f"Estorno da transação {trans_id}",
        "status": TransactionStatus.CONFIRMADO,
        "estorno_de_id": trans_id,
        "criado_por": user_id,
        "criado_em": datetime.now(timezone.utc),
        "atualizado_em": datetime.now(timezone.utc),
        "deletado_em": None
    }
    await db.transactions.insert_one(rev_trans)
    
    if original.get("conta_id"):
        adj = -original["valor"] if original["tipo"] == TransactionType.RECEITA else original["valor"]
        await db.accounts.update_one(
            {"id": original["conta_id"]},
            {"$inc": {"saldo_atual": adj}}
        )
    
    await log_financial_action(request, org_id, user_id, "estornar", rev_trans["id"], original, rev_trans)
    return success_response(data=rev_trans)

# ==================== BLOQUEIO DE PERÍODOS ====================
@router.get("/periodos-bloqueados")
@router.get("/periodos-bloqueados/")
@fin_router.get("/periodos-bloqueados")
@fin_router.get("/periodos-bloqueados/")
async def list_periodos_bloqueados(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    periodos = await db.lock_periods.find({"organizacao_id": org_id, "deletado_em": None}).sort([("ano", -1), ("mes", -1)]).to_list(100)
    return success_response(data=periodos)

@router.post("/periodos-bloqueados", status_code=status.HTTP_201_CREATED)
@router.post("/periodos-bloqueados/", status_code=status.HTTP_201_CREATED)
@fin_router.post("/periodos-bloqueados", status_code=status.HTTP_201_CREATED)
@fin_router.post("/periodos-bloqueados/", status_code=status.HTTP_201_CREATED)
async def create_periodo_bloqueado(data: Dict[str, Any], current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    periodo = LockPeriod(
        mes=data["mes"],
        ano=data["ano"],
        bloqueado=data.get("bloqueado", True),
        bloqueado_por=user_id,
        organizacao_id=org_id
    )
    doc = periodo.model_dump()
    await db.lock_periods.update_one(
        {"organizacao_id": org_id, "mes": data["mes"], "ano": data["ano"]},
        {"$set": doc},
        upsert=True
    )
    return success_response(data=doc)

# ==================== LOGS DE AUDITORIA ====================
@router.get("/logs-auditoria")
@router.get("/logs-auditoria/")
@fin_router.get("/logs-auditoria")
@fin_router.get("/logs-auditoria/")
async def list_logs_auditoria(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_church_admin)
):
    org_id = current_user.get("organizacao_id")
    skip = (page - 1) * limit
    total = await db.financial_logs.count_documents({"organizacao_id": org_id})
    logs = await db.financial_logs.find({"organizacao_id": org_id}).sort("criado_em", -1).skip(skip).limit(limit).to_list(limit)
    meta = {"page": page, "limit": limit, "total": total, "pages": (total + limit - 1) // limit}
    return success_response(data=logs, meta=meta)

# ==================== DASHBOARD / PAINEL ESTRATÉGICO ====================
@router.get("/dashboard")
@router.get("/dashboard/")
@router.get("/resumo")
@router.get("/resumo/")
@fin_router.get("/dashboard")
@fin_router.get("/dashboard/")
@fin_router.get("/resumo")
@fin_router.get("/resumo/")
async def get_financial_dashboard(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None}
    
    contas = await db.accounts.find({**tq, "status": "active"}).to_list(100)
    saldo_total = sum(c.get("saldo_atual", 0) for c in contas)
    
    tq_conf = {**tq, "status": TransactionStatus.CONFIRMADO}
    
    pipeline_tipo = [
        {"$match": tq_conf},
        {"$group": {"_id": "$tipo", "total": {"$sum": "$valor"}}}
    ]
    results = await db.transactions.aggregate(pipeline_tipo).to_list(10)
    total_receita = 0
    total_despesa = 0
    for r in results:
        if r["_id"] == TransactionType.RECEITA: total_receita = r["total"]
        if r["_id"] == TransactionType.DESPESA: total_despesa = r["total"]
    
    total_pendentes = await db.transactions.count_documents({**tq, "status": TransactionStatus.PENDENTE})
    
    return success_response(data={
        "saldo_total": saldo_total,
        "receita_total": total_receita,
        "despesa_total": total_despesa,
        "saldo_liquido": total_receita - total_despesa,
        "total_pendentes": total_pendentes,
        "contas": contas
    })

@router.get("/strategic-panel")
@fin_router.get("/strategic-panel")
async def get_financial_strategic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    tq = {"organizacao_id": org_id, "deletado_em": None, "status": TransactionStatus.CONFIRMADO}
    
    total_receita = 0
    total_despesa = 0
    
    pipeline = [
        {"$match": tq},
        {"$group": {"_id": "$tipo", "total": {"$sum": "$valor"}}}
    ]
    results = await db.transactions.aggregate(pipeline).to_list(10)
    for r in results:
        if r["_id"] == TransactionType.RECEITA: total_receita = r["total"]
        if r["_id"] == TransactionType.DESPESA: total_despesa = r["total"]
        
    return success_response(data={
        "receita_total": total_receita,
        "despesa_total": total_despesa,
        "saldo_liquido": total_receita - total_despesa
    })
