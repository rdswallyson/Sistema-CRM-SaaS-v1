from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from typing import List, Optional, Dict, Any
from ..core.security import require_church_admin, UserRole
from ..core.database import db, client
from ..core.response import success_response, error_response
from ..models.financial import Transaction, TransactionBase, TransactionType, TransactionStatus, Account, LockPeriod, FinancialLog
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
        "ip_origem": request.client.host,
        "criado_em": datetime.now(timezone.utc)
    }
    await db.financial_logs.insert_one(log)

@router.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_transaction(request: Request, data: TransactionBase, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    # 1. Check Lock Period
    await check_period_locked(org_id, data.data)
    
    # 2. Check Account
    account = await db.accounts.find_one({"id": data.conta_id, "organizacao_id": org_id, "deletado_em": None})
    if not account:
        raise HTTPException(status_code=404, detail="Conta financeira não encontrada")
    
    # 3. Transaction Logic with MongoDB Session (Simulation of ACID)
    async with await client.start_session() as session:
        async with session.start_transaction():
            trans = Transaction(**data.model_dump(), organizacao_id=org_id, criado_por=user_id)
            doc = trans.model_dump()
            await db.transactions.insert_one(doc, session=session)
            
            # Update balance if confirmed
            if data.status == TransactionStatus.CONFIRMADO:
                adj = data.valor if data.tipo == TransactionType.RECEITA else -data.valor
                await db.accounts.update_one(
                    {"id": data.conta_id},
                    {"$inc": {"saldo_atual": adj}},
                    session=session
                )
            
            await log_financial_action(request, org_id, user_id, "criar", trans.id, None, doc)
            return success_response(data=doc)

@router.post("/transactions/{trans_id}/reverse")
async def reverse_transaction(request: Request, trans_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    user_id = current_user.get("user_id")
    
    original = await db.transactions.find_one({"id": trans_id, "organizacao_id": org_id, "deletado_em": None})
    if not original:
        raise HTTPException(status_code=404, detail="Transação original não encontrada")
    
    if original["status"] != TransactionStatus.CONFIRMADO:
        raise HTTPException(status_code=400, detail="Apenas transações confirmadas podem ser estornadas")
        
    await check_period_locked(org_id, original["data"])
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            # 1. Create Reverse Transaction
            rev_type = TransactionType.DESPESA if original["tipo"] == TransactionType.RECEITA else TransactionType.RECEITA
            rev_trans = {
                "id": str(uuid.uuid4()),
                "organizacao_id": org_id,
                "tipo": rev_type,
                "valor": original["valor"],
                "data": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "conta_id": original["conta_id"],
                "categoria_id": original["categoria_id"],
                "descricao": f"Estorno da transação {trans_id}",
                "status": TransactionStatus.CONFIRMADO,
                "estorno_de_id": trans_id,
                "criado_por": user_id,
                "criado_em": datetime.now(timezone.utc)
            }
            await db.transactions.insert_one(rev_trans, session=session)
            
            # 2. Update Original Status to Canceled (or keep confirmed but linked)
            # Standard practice: Keep both confirmed, but linked. Or cancel original.
            # Here we keep both and link them.
            
            # 3. Update Account Balance (it was already updated by original, now we reverse it)
            adj = -original["valor"] if original["tipo"] == TransactionType.RECEITA else original["valor"]
            await db.accounts.update_one(
                {"id": original["conta_id"]},
                {"$inc": {"saldo_atual": adj}},
                session=session
            )
            
            await log_financial_action(request, org_id, user_id, "estornar", rev_trans["id"], original, rev_trans)
            return success_response(data=rev_trans)

@router.get("/strategic-panel")
async def get_financial_strategic_panel(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("tenant_id")
    tq = {"organizacao_id": org_id, "deletado_em": None, "status": TransactionStatus.CONFIRMADO}
    
    # Simplified stats for now
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
