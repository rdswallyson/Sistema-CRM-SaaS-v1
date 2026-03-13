from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Optional, Dict, Any
from ..core.security import require_church_admin, get_current_user
from ..core.database import db, client
from ..core.response import success_response, error_response
from ..models.external_events import (
    ExternalEvent, ExternalEventBase, Registration, RegistrationBase,
    Ticket, GatewayPayment, GatewayPaymentBase, PaymentStatus, TicketStatus, Attendance
)
from ..utils.qrcode_generator import generate_digital_card_qr
from datetime import datetime, timezone
import uuid
import hmac
import hashlib

router = APIRouter(tags=["Eventos Externos"])

# ==================== PUBLIC ROUTES ====================
@router.get("/eventos/{slug}")
async def get_event_public(slug: str):
    """Public route for event registration page."""
    event = await db.external_events.find_one({"slug": slug, "status": "ativo", "deletado_em": None})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Count registrations
    reg_count = await db.registrations.count_documents({"evento_id": event["id"], "deletado_em": None})
    event["inscricoes_count"] = reg_count
    
    return success_response(data=event)

@router.post("/eventos/{slug}/register")
async def register_for_event(slug: str, data: RegistrationBase):
    """Public registration endpoint."""
    event = await db.external_events.find_one({"slug": slug, "status": "ativo", "deletado_em": None})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Check capacity
    reg_count = await db.registrations.count_documents({"evento_id": event["id"], "deletado_em": None})
    if event.get("capacidade_maxima") and reg_count >= event["capacidade_maxima"]:
        raise HTTPException(status_code=400, detail="Evento lotado")
    
    # Create registration
    registration = Registration(**data.model_dump(), organizacao_id=event["organizacao_id"])
    reg_doc = registration.model_dump()
    await db.registrations.insert_one(reg_doc)
    
    return success_response(data=reg_doc)

# ==================== PAYMENT WEBHOOK ====================
@router.post("/webhooks/payment")
async def payment_webhook(request: Request, payload: Dict[str, Any]):
    """
    Webhook endpoint for payment gateway.
    Validates HMAC signature and processes payment confirmation.
    """
    # Validate HMAC signature
    signature = request.headers.get("X-Webhook-Signature", "")
    secret = "webhook-secret-key"  # Should come from env
    
    body_str = str(sorted(payload.items()))
    expected_sig = hmac.new(secret.encode(), body_str.encode(), hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=403, detail="Assinatura inválida")
    
    # Process payment
    gateway_payment = await db.gateway_payments.find_one({"gateway_id_externo": payload.get("id")})
    if not gateway_payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Update payment status
    status_map = {
        "approved": PaymentStatus.APROVADO,
        "rejected": PaymentStatus.REJEITADO,
        "refunded": PaymentStatus.ESTORNADO
    }
    new_status = status_map.get(payload.get("status"), PaymentStatus.PENDENTE)
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            # 1. Update payment status
            await db.gateway_payments.update_one(
                {"id": gateway_payment["id"]},
                {"$set": {"status": new_status, "webhook_payload": payload}},
                session=session
            )
            
            # 2. If approved, create ticket and financial transaction
            if new_status == PaymentStatus.APROVADO:
                registration = await db.registrations.find_one({"id": gateway_payment["inscricao_id"]})
                event = await db.external_events.find_one({"id": registration["evento_id"]})
                
                # Generate ticket
                codigo_unico = str(uuid.uuid4())
                qr_hash, qr_image = generate_digital_card_qr(codigo_unico, event["organizacao_id"], "ticket-secret")
                
                ticket = Ticket(
                    evento_id=event["id"],
                    inscricao_id=registration["id"],
                    codigo_unico=codigo_unico,
                    qr_hash=qr_hash,
                    qr_code_url=qr_image,
                    organizacao_id=event["organizacao_id"]
                )
                ticket_doc = ticket.model_dump()
                await db.tickets.insert_one(ticket_doc, session=session)
                
                # Create financial transaction (receita)
                trans = {
                    "id": str(uuid.uuid4()),
                    "organizacao_id": event["organizacao_id"],
                    "tipo": "receita",
                    "valor": gateway_payment["valor"],
                    "data": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "conta_id": "default-account",  # Should be configurable
                    "categoria_id": "evento-pago",  # Should be configurable
                    "descricao": f"Ingresso - {event['titulo']}",
                    "status": "confirmado",
                    "criado_por": "sistema",
                    "criado_em": datetime.now(timezone.utc)
                }
                await db.transactions.insert_one(trans, session=session)
                
                # Update registration status
                await db.registrations.update_one(
                    {"id": registration["id"]},
                    {"$set": {"status": "confirmada"}},
                    session=session
                )
    
    return success_response(data={"message": "Pagamento processado com sucesso"})

# ==================== ADMIN ROUTES ====================
@router.post("/church/external-events", status_code=status.HTTP_201_CREATED)
async def create_external_event(data: ExternalEventBase, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    # Check if slug is unique
    existing = await db.external_events.find_one({"slug": data.slug, "organizacao_id": org_id, "deletado_em": None})
    if existing:
        raise HTTPException(status_code=400, detail="Slug já existe nesta organização")
    
    event = ExternalEvent(**data.model_dump(), organizacao_id=org_id)
    doc = event.model_dump()
    await db.external_events.insert_one(doc)
    
    return success_response(data=doc)

@router.get("/church/external-events")
async def list_external_events(current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    events = await db.external_events.find({"organizacao_id": org_id, "deletado_em": None}).to_list(100)
    
    for e in events:
        e["inscricoes_count"] = await db.registrations.count_documents({"evento_id": e["id"], "deletado_em": None})
    
    return success_response(data=events)

@router.get("/church/external-events/{event_id}/registrations")
async def get_event_registrations(event_id: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    
    event = await db.external_events.find_one({"id": event_id, "organizacao_id": org_id, "deletado_em": None})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    registrations = await db.registrations.find({"evento_id": event_id, "deletado_em": None}).to_list(1000)
    
    for reg in registrations:
        # Get ticket info
        ticket = await db.tickets.find_one({"inscricao_id": reg["id"]}, {"_id": 0, "codigo_unico": 1, "status": 1})
        if ticket:
            reg["ticket"] = ticket
    
    return success_response(data=registrations)

@router.post("/church/external-events/{event_id}/checkin")
async def checkin_via_qr(event_id: str, qr_hash: str, current_user: dict = Depends(require_church_admin)):
    org_id = current_user.get("organizacao_id")
    user_id = current_user.get("user_id")
    
    # Find ticket by QR hash
    ticket = await db.tickets.find_one({"qr_hash": qr_hash, "evento_id": event_id, "status": TicketStatus.VALIDO})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ingresso inválido ou já utilizado")
    
    # Register attendance
    attendance = Attendance(
        ingresso_id=ticket["id"],
        usuario_checkin_id=user_id,
        organizacao_id=org_id
    )
    att_doc = attendance.model_dump()
    await db.attendances.insert_one(att_doc)
    
    # Mark ticket as used
    await db.tickets.update_one(
        {"id": ticket["id"]},
        {"$set": {"status": TicketStatus.UTILIZADO}}
    )
    
    return success_response(data={"message": "Check-in realizado com sucesso", "attendance": att_doc})
