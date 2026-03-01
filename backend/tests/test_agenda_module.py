"""
Test file for the Agenda module endpoints:
- Events CRUD with enhanced fields (category, event_type, is_paid, financial integration)
- Event Inscriptions (create, list, delete, confirm payment, duplicate check, capacity limit)
- Avisos (Announcements) CRUD
- Anotacoes (Personal Notes) CRUD
- Notificacoes (Notifications) CRUD
- Calendario (Calendar aggregation)
- Export (events and inscriptions)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestAgendaModule:
    """Agenda module comprehensive tests"""
    
    # Shared test data
    auth_token = None
    tenant_id = None
    user_id = None
    test_event_id = None
    test_paid_event_id = None
    test_member_id = None
    test_inscricao_id = None
    test_aviso_id = None
    test_anotacao_id = None
    test_conta_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - authenticate once"""
        if not TestAgendaModule.auth_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "crud@test.com",
                "password": "crud123"
            })
            assert response.status_code == 200, f"Login failed: {response.text}"
            data = response.json()
            TestAgendaModule.auth_token = data["token"]
            TestAgendaModule.tenant_id = data["user"]["tenant_id"]
            TestAgendaModule.user_id = data["user"]["id"]
    
    def get_headers(self):
        return {
            "Authorization": f"Bearer {TestAgendaModule.auth_token}",
            "Content-Type": "application/json"
        }

    # ==================== EVENTS CRUD ====================
    
    def test_01_create_free_event(self):
        """Create a free event with enhanced fields"""
        payload = {
            "title": f"TEST_Free_Event_{uuid.uuid4().hex[:6]}",
            "description": "Test free event description",
            "category": "Conferencia",
            "event_type": "gratuito",
            "event_date": "2026-03-15",
            "event_time": "19:00",
            "location": "Salao Principal",
            "max_capacity": 100,
            "is_paid": False,
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/church/events", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create free event failed: {response.text}"
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["is_paid"] == False
        TestAgendaModule.test_event_id = data["id"]
        print(f"Created free event: {data['id']}")
    
    def test_02_create_paid_event(self):
        """Create a paid event with financial fields"""
        payload = {
            "title": f"TEST_Paid_Event_{uuid.uuid4().hex[:6]}",
            "description": "Test paid event description",
            "category": "Workshop",
            "event_type": "pago",
            "event_date": "2026-03-20",
            "event_time": "09:00",
            "location": "Auditorio",
            "max_capacity": 50,
            "is_paid": True,
            "price": 150.00,
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/church/events", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create paid event failed: {response.text}"
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["is_paid"] == True
        assert data["price"] == 150.00
        TestAgendaModule.test_paid_event_id = data["id"]
        print(f"Created paid event: {data['id']}")
    
    def test_03_list_events(self):
        """List events and verify"""
        response = requests.get(f"{BASE_URL}/api/church/events", headers=self.get_headers())
        assert response.status_code == 200, f"List events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Verify our test events are in the list
        event_ids = [e["id"] for e in data]
        assert TestAgendaModule.test_event_id in event_ids
        assert TestAgendaModule.test_paid_event_id in event_ids
        print(f"Listed {len(data)} events")
    
    def test_04_get_event_by_id(self):
        """Get event by ID"""
        response = requests.get(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}", headers=self.get_headers())
        assert response.status_code == 200, f"Get event failed: {response.text}"
        data = response.json()
        assert data["id"] == TestAgendaModule.test_event_id
        assert "inscricoes_count" in data  # Enhanced field
        print(f"Got event: {data['title']}")
    
    def test_05_update_event(self):
        """Update event"""
        updates = {
            "location": "Novo Local Atualizado",
            "max_capacity": 150
        }
        response = requests.put(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}", 
                               json=updates, headers=self.get_headers())
        assert response.status_code == 200, f"Update event failed: {response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}", headers=self.get_headers())
        data = get_response.json()
        assert data["location"] == "Novo Local Atualizado"
        assert data["max_capacity"] == 150
        print("Event updated successfully")
    
    def test_06_filter_events_by_status(self):
        """Filter events by status"""
        response = requests.get(f"{BASE_URL}/api/church/events?status=active", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        for event in data:
            assert event["status"] == "active"
        print(f"Filtered {len(data)} active events")

    # ==================== INSCRICOES (REGISTRATIONS) ====================
    
    def test_10_create_member_for_inscricao(self):
        """Create a test member for inscription tests"""
        payload = {
            "name": f"TEST_Member_Inscricao_{uuid.uuid4().hex[:6]}",
            "email": f"test_insc_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "11999990000",
            "birth_date": "1990-05-15",
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/church/members", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create member failed: {response.text}"
        TestAgendaModule.test_member_id = response.json()["id"]
        print(f"Created test member: {TestAgendaModule.test_member_id}")
    
    def test_11_create_inscricao_free_event(self):
        """Create inscription for free event"""
        payload = {"membro_id": TestAgendaModule.test_member_id}
        response = requests.post(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}/inscricoes", 
                                json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create inscricao failed: {response.text}"
        data = response.json()
        assert "id" in data
        TestAgendaModule.test_inscricao_id = data["id"]
        print(f"Created inscription: {data['id']}")
    
    def test_12_duplicate_inscricao_rejected(self):
        """Verify duplicate inscription is rejected"""
        payload = {"membro_id": TestAgendaModule.test_member_id}
        response = requests.post(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}/inscricoes", 
                                json=payload, headers=self.get_headers())
        assert response.status_code == 400, "Duplicate inscription should be rejected"
        assert "inscrito" in response.json()["detail"].lower()
        print("Duplicate inscription correctly rejected")
    
    def test_13_list_inscricoes(self):
        """List inscriptions for event"""
        response = requests.get(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}/inscricoes", 
                               headers=self.get_headers())
        assert response.status_code == 200, f"List inscricoes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify member info enrichment
        assert "membro_nome" in data[0] or "membro_id" in data[0]
        print(f"Listed {len(data)} inscriptions")
    
    def test_14_create_inscricao_paid_event_pending(self):
        """Create inscription for paid event (payment pending)"""
        # Create another member for paid event
        member_payload = {
            "name": f"TEST_Member_Paid_{uuid.uuid4().hex[:6]}",
            "email": f"test_paid_{uuid.uuid4().hex[:6]}@test.com",
            "status": "active"
        }
        member_response = requests.post(f"{BASE_URL}/api/church/members", json=member_payload, headers=self.get_headers())
        assert member_response.status_code == 200
        paid_member_id = member_response.json()["id"]
        
        payload = {"membro_id": paid_member_id, "status_pagamento": "pendente"}
        response = requests.post(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_paid_event_id}/inscricoes", 
                                json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create paid inscricao failed: {response.text}"
        data = response.json()
        TestAgendaModule.paid_inscricao_id = data["id"]
        print(f"Created paid event inscription (pending): {data['id']}")
    
    def test_15_confirm_payment_inscricao(self):
        """Confirm payment for inscription"""
        response = requests.put(
            f"{BASE_URL}/api/church/events/{TestAgendaModule.test_paid_event_id}/inscricoes/{TestAgendaModule.paid_inscricao_id}/confirmar-pagamento",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Confirm payment failed: {response.text}"
        data = response.json()
        assert "confirmado" in data.get("message", "").lower() or "transacao_id" in data
        print("Payment confirmed successfully")
    
    def test_16_cancel_inscricao(self):
        """Cancel an inscription"""
        response = requests.delete(
            f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}/inscricoes/{TestAgendaModule.test_inscricao_id}",
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Cancel inscricao failed: {response.text}"
        print("Inscription cancelled successfully")

    # ==================== AVISOS (ANNOUNCEMENTS) ====================
    
    def test_20_create_aviso(self):
        """Create announcement"""
        payload = {
            "titulo": f"TEST_Aviso_{uuid.uuid4().hex[:6]}",
            "conteudo": "Conteudo do aviso de teste",
            "prioridade": "alta",
            "status": "publicado",
            "fixado": False
        }
        response = requests.post(f"{BASE_URL}/api/church/avisos", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create aviso failed: {response.text}"
        data = response.json()
        assert data["titulo"] == payload["titulo"]
        assert data["prioridade"] == "alta"
        TestAgendaModule.test_aviso_id = data["id"]
        print(f"Created aviso: {data['id']}")
    
    def test_21_list_avisos(self):
        """List announcements"""
        response = requests.get(f"{BASE_URL}/api/church/avisos", headers=self.get_headers())
        assert response.status_code == 200, f"List avisos failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert any(a["id"] == TestAgendaModule.test_aviso_id for a in data)
        print(f"Listed {len(data)} avisos")
    
    def test_22_filter_avisos_by_prioridade(self):
        """Filter announcements by priority"""
        response = requests.get(f"{BASE_URL}/api/church/avisos?prioridade=alta", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        for aviso in data:
            assert aviso["prioridade"] == "alta"
        print(f"Filtered {len(data)} high priority avisos")
    
    def test_23_update_aviso(self):
        """Update announcement (pin/unpin)"""
        updates = {"fixado": True, "prioridade": "urgente"}
        response = requests.put(f"{BASE_URL}/api/church/avisos/{TestAgendaModule.test_aviso_id}", 
                               json=updates, headers=self.get_headers())
        assert response.status_code == 200, f"Update aviso failed: {response.text}"
        
        # Verify
        list_response = requests.get(f"{BASE_URL}/api/church/avisos", headers=self.get_headers())
        avisos = list_response.json()
        test_aviso = next((a for a in avisos if a["id"] == TestAgendaModule.test_aviso_id), None)
        assert test_aviso["fixado"] == True
        print("Aviso pinned successfully")

    # ==================== ANOTACOES (PERSONAL NOTES) ====================
    
    def test_30_create_anotacao(self):
        """Create personal note"""
        payload = {
            "titulo": f"TEST_Nota_{uuid.uuid4().hex[:6]}",
            "conteudo": "Minha anotacao pessoal de teste",
            "cor": "#3b82f6",
            "data_lembrete": "2026-03-25"
        }
        response = requests.post(f"{BASE_URL}/api/church/anotacoes", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create anotacao failed: {response.text}"
        data = response.json()
        assert data["titulo"] == payload["titulo"]
        TestAgendaModule.test_anotacao_id = data["id"]
        print(f"Created anotacao: {data['id']}")
    
    def test_31_list_anotacoes(self):
        """List personal notes (user-private)"""
        response = requests.get(f"{BASE_URL}/api/church/anotacoes", headers=self.get_headers())
        assert response.status_code == 200, f"List anotacoes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert any(a["id"] == TestAgendaModule.test_anotacao_id for a in data)
        print(f"Listed {len(data)} anotacoes")
    
    def test_32_update_anotacao(self):
        """Update personal note"""
        updates = {"conteudo": "Conteudo atualizado da anotacao", "cor": "#ef4444"}
        response = requests.put(f"{BASE_URL}/api/church/anotacoes/{TestAgendaModule.test_anotacao_id}", 
                               json=updates, headers=self.get_headers())
        assert response.status_code == 200, f"Update anotacao failed: {response.text}"
        print("Anotacao updated successfully")

    # ==================== NOTIFICACOES ====================
    
    def test_40_list_notificacoes(self):
        """List notifications"""
        response = requests.get(f"{BASE_URL}/api/church/notificacoes", headers=self.get_headers())
        assert response.status_code == 200, f"List notificacoes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} notificacoes")
    
    def test_41_count_unread_notificacoes(self):
        """Count unread notifications"""
        response = requests.get(f"{BASE_URL}/api/church/notificacoes/count", headers=self.get_headers())
        assert response.status_code == 200, f"Count notificacoes failed: {response.text}"
        data = response.json()
        assert "count" in data
        print(f"Unread notifications: {data['count']}")
    
    def test_42_filter_notificacoes_by_tipo(self):
        """Filter notifications by type"""
        response = requests.get(f"{BASE_URL}/api/church/notificacoes?tipo=evento_novo", headers=self.get_headers())
        assert response.status_code == 200
        print("Filtered notifications by tipo")
    
    def test_43_mark_all_read(self):
        """Mark all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/church/notificacoes/marcar-todas-lidas", headers=self.get_headers())
        assert response.status_code == 200, f"Mark all read failed: {response.text}"
        print("All notifications marked as read")

    # ==================== CALENDARIO ====================
    
    def test_50_calendario_aggregation(self):
        """Test calendar aggregation endpoint"""
        import datetime
        now = datetime.datetime.now()
        params = {"mes": now.month, "ano": now.year}
        response = requests.get(f"{BASE_URL}/api/church/calendario", params=params, headers=self.get_headers())
        assert response.status_code == 200, f"Calendario failed: {response.text}"
        data = response.json()
        assert "items" in data
        assert "month" in data
        assert "year" in data
        assert data["month"] == now.month
        print(f"Calendar returned {len(data['items'])} items for {data['month']}/{data['year']}")
    
    def test_51_calendario_filter_by_tipo(self):
        """Filter calendar by type"""
        response = requests.get(f"{BASE_URL}/api/church/calendario?tipo=evento", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        for item in data.get("items", []):
            assert item["type"] == "evento"
        print(f"Filtered calendar to {len(data['items'])} eventos")

    # ==================== EXPORT ====================
    
    def test_60_export_eventos(self):
        """Export events by period"""
        params = {"data_inicio": "2026-01-01", "data_fim": "2026-12-31"}
        response = requests.get(f"{BASE_URL}/api/church/agenda/exportar/eventos", params=params, headers=self.get_headers())
        assert response.status_code == 200, f"Export eventos failed: {response.text}"
        data = response.json()
        assert "events" in data
        assert "total" in data
        print(f"Exported {data['total']} events")
    
    def test_61_export_inscricoes(self):
        """Export inscriptions for an event"""
        response = requests.get(f"{BASE_URL}/api/church/agenda/exportar/inscricoes/{TestAgendaModule.test_paid_event_id}", 
                               headers=self.get_headers())
        assert response.status_code == 200, f"Export inscricoes failed: {response.text}"
        data = response.json()
        assert "inscricoes" in data
        assert "evento_titulo" in data
        assert "total" in data
        print(f"Exported {data['total']} inscricoes for event")

    # ==================== CLEANUP ====================
    
    def test_90_cleanup_anotacao(self):
        """Cleanup - delete anotacao"""
        if TestAgendaModule.test_anotacao_id:
            response = requests.delete(f"{BASE_URL}/api/church/anotacoes/{TestAgendaModule.test_anotacao_id}", 
                                      headers=self.get_headers())
            assert response.status_code == 200
            print("Anotacao deleted")
    
    def test_91_cleanup_aviso(self):
        """Cleanup - delete aviso"""
        if TestAgendaModule.test_aviso_id:
            response = requests.delete(f"{BASE_URL}/api/church/avisos/{TestAgendaModule.test_aviso_id}", 
                                      headers=self.get_headers())
            assert response.status_code == 200
            print("Aviso deleted")
    
    def test_92_cleanup_paid_event(self):
        """Cleanup - delete paid event"""
        if TestAgendaModule.test_paid_event_id:
            response = requests.delete(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_paid_event_id}", 
                                      headers=self.get_headers())
            assert response.status_code == 200
            print("Paid event deleted")
    
    def test_93_cleanup_free_event(self):
        """Cleanup - delete free event"""
        if TestAgendaModule.test_event_id:
            response = requests.delete(f"{BASE_URL}/api/church/events/{TestAgendaModule.test_event_id}", 
                                      headers=self.get_headers())
            assert response.status_code == 200
            print("Free event deleted")
    
    def test_94_cleanup_member(self):
        """Cleanup - delete test member"""
        if TestAgendaModule.test_member_id:
            response = requests.delete(f"{BASE_URL}/api/church/members/{TestAgendaModule.test_member_id}", 
                                      headers=self.get_headers())
            # May return 200 or 404 if already cleaned up
            print("Test member cleanup attempted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
