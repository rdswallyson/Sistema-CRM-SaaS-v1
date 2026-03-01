"""
Financial Module Backend Tests
Tests for: Contas, Categorias, Centros de Custo, Contatos, Transacoes, Periodos Bloqueados, Resumo, Painel Estrategico
Business rules tested:
- Confirmed transactions cannot be edited (only cancelled/estorno)
- Negative values rejected
- Blocked periods prevent new transactions
- Accounts with transactions cannot be deleted
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin.teste.154017@teste.com"
TEST_PASSWORD = "admin123"

class TestAuthAndSetup:
    """Authentication and initial setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_login_success(self, auth_token):
        """Test that login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 20
        print(f"Auth token obtained successfully")


class TestContasFinanceiras:
    """Financial Accounts (Contas) CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_conta_id(self, auth_headers):
        """Create test account and return ID for other tests"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Bancaria Principal",
            "tipo": "banco",
            "saldo_inicial": 1000.00,
            "status": "active"
        })
        assert response.status_code == 200, f"Create conta failed: {response.text}"
        data = response.json()
        assert "id" in data
        yield data["id"]
        # Cleanup - try to delete, ignore if fails (may have transactions)
        requests.delete(f"{BASE_URL}/api/church/fin/contas/{data['id']}", headers=auth_headers)
    
    def test_create_conta(self, auth_headers):
        """Test creating a financial account"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Caixa Geral",
            "tipo": "caixa",
            "saldo_inicial": 500.00
        })
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_Caixa Geral"
        assert data["tipo"] == "caixa"
        assert data["saldo_inicial"] == 500.00
        assert data["saldo_atual"] == 500.00  # saldo_atual should equal saldo_inicial initially
        # Cleanup
        requests.delete(f"{BASE_URL}/api/church/fin/contas/{data['id']}", headers=auth_headers)
        print("Create conta: PASS")
    
    def test_list_contas(self, auth_headers, test_conta_id):
        """Test listing financial accounts"""
        response = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should contain our test account
        ids = [c["id"] for c in data]
        assert test_conta_id in ids
        print(f"List contas: PASS ({len(data)} contas)")
    
    def test_update_conta(self, auth_headers, test_conta_id):
        """Test updating account name and tipo"""
        response = requests.put(f"{BASE_URL}/api/church/fin/contas/{test_conta_id}", headers=auth_headers, json={
            "nome": "TEST_Conta Bancaria Atualizada",
            "tipo": "carteira_digital"
        })
        assert response.status_code == 200
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers)
        contas = get_resp.json()
        updated = next((c for c in contas if c["id"] == test_conta_id), None)
        assert updated["nome"] == "TEST_Conta Bancaria Atualizada"
        assert updated["tipo"] == "carteira_digital"
        print("Update conta: PASS")


class TestCategoriasFinanceiras:
    """Financial Categories CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_categoria_id(self, auth_headers):
        """Create test category"""
        response = requests.post(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers, json={
            "nome": "TEST_Dizimos",
            "tipo": "receita",
            "cor": "#22c55e"
        })
        assert response.status_code == 200
        data = response.json()
        yield data["id"]
        requests.delete(f"{BASE_URL}/api/church/fin/categorias/{data['id']}", headers=auth_headers)
    
    def test_create_categoria_receita(self, auth_headers):
        """Test creating income category"""
        response = requests.post(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers, json={
            "nome": "TEST_Ofertas",
            "tipo": "receita",
            "cor": "#10b981"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_Ofertas"
        assert data["tipo"] == "receita"
        assert data["cor"] == "#10b981"
        requests.delete(f"{BASE_URL}/api/church/fin/categorias/{data['id']}", headers=auth_headers)
        print("Create categoria receita: PASS")
    
    def test_create_categoria_despesa(self, auth_headers):
        """Test creating expense category"""
        response = requests.post(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers, json={
            "nome": "TEST_Manutencao",
            "tipo": "despesa",
            "cor": "#ef4444"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["tipo"] == "despesa"
        requests.delete(f"{BASE_URL}/api/church/fin/categorias/{data['id']}", headers=auth_headers)
        print("Create categoria despesa: PASS")
    
    def test_list_categorias_filter_tipo(self, auth_headers, test_categoria_id):
        """Test listing categories with tipo filter"""
        response = requests.get(f"{BASE_URL}/api/church/fin/categorias?tipo=receita", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All should be receita type
        for cat in data:
            assert cat["tipo"] == "receita"
        print(f"List categorias (receita filter): PASS ({len(data)} items)")
    
    def test_update_categoria(self, auth_headers, test_categoria_id):
        """Test updating category"""
        response = requests.put(f"{BASE_URL}/api/church/fin/categorias/{test_categoria_id}", headers=auth_headers, json={
            "nome": "TEST_Dizimos Atualizados",
            "cor": "#16a34a"
        })
        assert response.status_code == 200
        print("Update categoria: PASS")
    
    def test_delete_categoria(self, auth_headers):
        """Test deleting category"""
        # Create then delete
        create_resp = requests.post(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers, json={
            "nome": "TEST_Para Deletar",
            "tipo": "despesa"
        })
        cat_id = create_resp.json()["id"]
        
        del_resp = requests.delete(f"{BASE_URL}/api/church/fin/categorias/{cat_id}", headers=auth_headers)
        assert del_resp.status_code == 200
        print("Delete categoria: PASS")


class TestCentrosCusto:
    """Cost Centers CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_create_centro_custo(self, auth_headers):
        """Test creating cost center"""
        response = requests.post(f"{BASE_URL}/api/church/fin/centros-custo", headers=auth_headers, json={
            "nome": "TEST_Departamento Louvor",
            "tipo": "departamento"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_Departamento Louvor"
        assert data["tipo"] == "departamento"
        requests.delete(f"{BASE_URL}/api/church/fin/centros-custo/{data['id']}", headers=auth_headers)
        print("Create centro custo: PASS")
    
    def test_list_centros_custo(self, auth_headers):
        """Test listing cost centers"""
        # Create one first
        create_resp = requests.post(f"{BASE_URL}/api/church/fin/centros-custo", headers=auth_headers, json={
            "nome": "TEST_Projeto Missoes",
            "tipo": "projeto"
        })
        cc_id = create_resp.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/church/fin/centros-custo", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        requests.delete(f"{BASE_URL}/api/church/fin/centros-custo/{cc_id}", headers=auth_headers)
        print(f"List centros custo: PASS ({len(data)} items)")


class TestContatosFinanceiros:
    """Financial Contacts CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_create_contato(self, auth_headers):
        """Test creating financial contact"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contatos", headers=auth_headers, json={
            "nome": "TEST_Fornecedor Energia",
            "tipo": "fornecedor",
            "email": "teste@fornecedor.com",
            "telefone": "(11) 99999-9999"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == "TEST_Fornecedor Energia"
        assert data["tipo"] == "fornecedor"
        assert data["email"] == "teste@fornecedor.com"
        requests.delete(f"{BASE_URL}/api/church/fin/contatos/{data['id']}", headers=auth_headers)
        print("Create contato: PASS")
    
    def test_list_contatos(self, auth_headers):
        """Test listing contacts"""
        response = requests.get(f"{BASE_URL}/api/church/fin/contatos", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("List contatos: PASS")


class TestTransacoes:
    """Transaction tests including business rules"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_conta(self, auth_headers):
        """Create test account for transactions"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Para Transacoes",
            "tipo": "banco",
            "saldo_inicial": 5000.00
        })
        data = response.json()
        yield data
        # Cleanup happens after all transaction tests
        # Account may not be deletable if it has transactions
    
    @pytest.fixture(scope="class")
    def test_conta_destino(self, auth_headers):
        """Create second test account for transfers"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Destino",
            "tipo": "caixa",
            "saldo_inicial": 1000.00
        })
        data = response.json()
        yield data
    
    @pytest.fixture(scope="class")
    def test_categoria(self, auth_headers):
        """Create test category for transactions"""
        response = requests.post(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers, json={
            "nome": "TEST_Categoria Transacao",
            "tipo": "receita",
            "cor": "#3b82f6"
        })
        data = response.json()
        yield data
        requests.delete(f"{BASE_URL}/api/church/fin/categorias/{data['id']}", headers=auth_headers)
    
    def test_create_transacao_receita(self, auth_headers, test_conta, test_categoria):
        """Test creating income transaction"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": 500.00,
            "data": today,
            "conta_id": test_conta["id"],
            "categoria_id": test_categoria["id"],
            "descricao": "TEST_Receita de dizimo",
            "status": "confirmado"
        })
        assert response.status_code == 200, f"Create receita failed: {response.text}"
        data = response.json()
        assert data["tipo"] == "receita"
        assert data["valor"] == 500.00
        assert data["status"] == "confirmado"
        print("Create transacao receita: PASS")
        return data
    
    def test_create_transacao_despesa(self, auth_headers, test_conta):
        """Test creating expense transaction"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "despesa",
            "valor": 200.00,
            "data": today,
            "conta_id": test_conta["id"],
            "descricao": "TEST_Pagamento de conta",
            "status": "confirmado"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["tipo"] == "despesa"
        print("Create transacao despesa: PASS")
    
    def test_create_transacao_transferencia(self, auth_headers, test_conta, test_conta_destino):
        """Test creating transfer between accounts"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get initial balances
        contas_before = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers).json()
        origem_before = next((c for c in contas_before if c["id"] == test_conta["id"]), None)
        destino_before = next((c for c in contas_before if c["id"] == test_conta_destino["id"]), None)
        
        response = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "transferencia",
            "valor": 300.00,
            "data": today,
            "conta_id": test_conta["id"],
            "conta_destino_id": test_conta_destino["id"],
            "descricao": "TEST_Transferencia entre contas",
            "status": "confirmado"
        })
        assert response.status_code == 200
        
        # Verify balances updated correctly
        contas_after = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers).json()
        origem_after = next((c for c in contas_after if c["id"] == test_conta["id"]), None)
        destino_after = next((c for c in contas_after if c["id"] == test_conta_destino["id"]), None)
        
        # Origin should decrease, destination should increase
        assert origem_after["saldo_atual"] < origem_before["saldo_atual"], "Origin balance should decrease"
        assert destino_after["saldo_atual"] > destino_before["saldo_atual"], "Destination balance should increase"
        print("Create transacao transferencia: PASS (balances updated correctly)")
    
    def test_list_transacoes_filters(self, auth_headers, test_conta):
        """Test listing transactions with filters"""
        # Test tipo filter
        response = requests.get(f"{BASE_URL}/api/church/fin/transacoes?tipo=receita", headers=auth_headers)
        assert response.status_code == 200
        for tx in response.json():
            assert tx["tipo"] == "receita"
        
        # Test status filter
        response = requests.get(f"{BASE_URL}/api/church/fin/transacoes?status=confirmado", headers=auth_headers)
        assert response.status_code == 200
        for tx in response.json():
            assert tx["status"] == "confirmado"
        
        print("List transacoes with filters: PASS")
    
    def test_negative_value_rejected(self, auth_headers, test_conta):
        """Test that negative values are rejected"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": -100.00,  # Negative value
            "data": today,
            "conta_id": test_conta["id"],
            "status": "confirmado"
        })
        assert response.status_code == 400, "Negative value should be rejected"
        assert "positivo" in response.json().get("detail", "").lower() or "valor" in response.json().get("detail", "").lower()
        print("Negative value rejected: PASS")
    
    def test_confirmed_transaction_cannot_be_edited(self, auth_headers, test_conta):
        """Test that confirmed transactions can only be cancelled, not edited"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create confirmed transaction
        create_resp = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": 150.00,
            "data": today,
            "conta_id": test_conta["id"],
            "descricao": "TEST_Transacao para testar edicao",
            "status": "confirmado"
        })
        tx_id = create_resp.json()["id"]
        
        # Try to edit (should fail with anything other than cancel)
        edit_resp = requests.put(f"{BASE_URL}/api/church/fin/transacoes/{tx_id}", headers=auth_headers, json={
            "descricao": "Nova descricao",
            "valor": 200.00  # Trying to change value
        })
        assert edit_resp.status_code == 400, "Editing confirmed transaction should fail"
        assert "confirmada" in edit_resp.json().get("detail", "").lower() or "cancelada" in edit_resp.json().get("detail", "").lower()
        print("Confirmed transaction edit blocked: PASS")
    
    def test_confirmed_transaction_can_be_cancelled(self, auth_headers, test_conta):
        """Test that confirmed transactions can be cancelled (estorno) with balance reversal"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get initial balance
        contas_before = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers).json()
        conta_before = next((c for c in contas_before if c["id"] == test_conta["id"]), None)
        
        # Create confirmed transaction
        create_resp = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": 250.00,
            "data": today,
            "conta_id": test_conta["id"],
            "descricao": "TEST_Transacao para cancelar",
            "status": "confirmado"
        })
        tx_id = create_resp.json()["id"]
        
        # Verify balance increased
        contas_after_create = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers).json()
        conta_after_create = next((c for c in contas_after_create if c["id"] == test_conta["id"]), None)
        assert conta_after_create["saldo_atual"] == conta_before["saldo_atual"] + 250.00
        
        # Cancel (estorno)
        cancel_resp = requests.put(f"{BASE_URL}/api/church/fin/transacoes/{tx_id}", headers=auth_headers, json={
            "status": "cancelado"
        })
        assert cancel_resp.status_code == 200, f"Cancel should succeed: {cancel_resp.text}"
        
        # Verify balance reversed
        contas_after_cancel = requests.get(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers).json()
        conta_after_cancel = next((c for c in contas_after_cancel if c["id"] == test_conta["id"]), None)
        assert conta_after_cancel["saldo_atual"] == conta_before["saldo_atual"], "Balance should be reversed after cancel"
        print("Confirmed transaction cancelled with balance reversal: PASS")
    
    def test_confirmed_transaction_cannot_be_deleted(self, auth_headers, test_conta):
        """Test that confirmed transactions cannot be deleted"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Create confirmed transaction
        create_resp = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "despesa",
            "valor": 100.00,
            "data": today,
            "conta_id": test_conta["id"],
            "descricao": "TEST_Transacao para tentar deletar",
            "status": "confirmado"
        })
        tx_id = create_resp.json()["id"]
        
        # Try to delete (should fail)
        del_resp = requests.delete(f"{BASE_URL}/api/church/fin/transacoes/{tx_id}", headers=auth_headers)
        assert del_resp.status_code == 400, "Delete confirmed transaction should fail"
        assert "confirmada" in del_resp.json().get("detail", "").lower()
        print("Confirmed transaction delete blocked: PASS")


class TestPeriodosBloqueados:
    """Blocked Periods tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_conta_for_period(self, auth_headers):
        """Create test account for period tests"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Periodo Bloqueado",
            "tipo": "banco",
            "saldo_inicial": 1000.00
        })
        data = response.json()
        yield data
    
    def test_block_period(self, auth_headers):
        """Test blocking a period"""
        response = requests.post(f"{BASE_URL}/api/church/fin/periodos-bloqueados", headers=auth_headers, json={
            "ano": 2024,
            "mes": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["ano"] == 2024
        assert data["mes"] == 1
        print("Block period: PASS")
        return data["id"]
    
    def test_list_blocked_periods(self, auth_headers):
        """Test listing blocked periods"""
        response = requests.get(f"{BASE_URL}/api/church/fin/periodos-bloqueados", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"List blocked periods: PASS ({len(response.json())} items)")
    
    def test_transaction_in_blocked_period_rejected(self, auth_headers, test_conta_for_period):
        """Test that transactions in blocked period are rejected"""
        # First block a period
        block_resp = requests.post(f"{BASE_URL}/api/church/fin/periodos-bloqueados", headers=auth_headers, json={
            "ano": 2024,
            "mes": 2
        })
        
        # Try to create transaction in that period
        tx_resp = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": 100.00,
            "data": "2024-02-15",  # February 2024 - blocked period
            "conta_id": test_conta_for_period["id"],
            "status": "confirmado"
        })
        assert tx_resp.status_code == 400, "Transaction in blocked period should be rejected"
        assert "bloqueado" in tx_resp.json().get("detail", "").lower()
        print("Transaction in blocked period rejected: PASS")
    
    def test_unblock_period(self, auth_headers):
        """Test unblocking a period"""
        # Get blocked periods
        list_resp = requests.get(f"{BASE_URL}/api/church/fin/periodos-bloqueados", headers=auth_headers)
        periods = list_resp.json()
        
        if periods:
            pb_id = periods[0]["id"]
            del_resp = requests.delete(f"{BASE_URL}/api/church/fin/periodos-bloqueados/{pb_id}", headers=auth_headers)
            assert del_resp.status_code == 200
            print("Unblock period: PASS")


class TestAccountDeletionWithTransactions:
    """Test that accounts with transactions cannot be deleted"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_account_with_transactions_cannot_be_deleted(self, auth_headers):
        """Test that accounts with linked transactions cannot be deleted"""
        # Create account
        conta_resp = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Nao Deletavel",
            "tipo": "banco",
            "saldo_inicial": 500.00
        })
        conta_id = conta_resp.json()["id"]
        
        # Create transaction linked to account
        today = datetime.now().strftime("%Y-%m-%d")
        tx_resp = requests.post(f"{BASE_URL}/api/church/fin/transacoes", headers=auth_headers, json={
            "tipo": "receita",
            "valor": 100.00,
            "data": today,
            "conta_id": conta_id,
            "status": "pendente"  # Use pendente so we can clean up
        })
        
        # Try to delete account (should fail)
        del_resp = requests.delete(f"{BASE_URL}/api/church/fin/contas/{conta_id}", headers=auth_headers)
        assert del_resp.status_code == 400, "Delete account with transactions should fail"
        assert "transações" in del_resp.json().get("detail", "").lower() or "vinculadas" in del_resp.json().get("detail", "").lower()
        print("Account with transactions delete blocked: PASS")


class TestFinanceiroLogs:
    """Audit logs tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_list_logs(self, auth_headers):
        """Test that audit logs are recorded"""
        response = requests.get(f"{BASE_URL}/api/church/fin/logs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have logs from previous tests
        if data:
            log = data[0]
            assert "acao" in log
            assert "usuario" in log
            assert "data_hora" in log
        print(f"List audit logs: PASS ({len(data)} logs)")


class TestResumoFinanceiro:
    """Financial Summary (Resumo) tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_resumo(self, auth_headers):
        """Test financial summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/church/fin/resumo", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "saldo_total" in data
        assert "receitas_mes" in data
        assert "despesas_mes" in data
        assert "resultado_mes" in data
        assert "contas" in data
        assert "por_categoria" in data
        assert "fluxo_mensal" in data
        
        print(f"Resumo financeiro: PASS (saldo_total={data['saldo_total']})")


class TestPainelEstrategico:
    """Strategic Dashboard tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_painel_estrategico(self, auth_headers):
        """Test strategic dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/church/fin/painel-estrategico", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "receita_anual" in data
        assert "despesa_anual" in data
        assert "resultado_anual" in data
        assert "comparativo_mensal" in data
        assert "top_despesas" in data
        assert "saude_financeira" in data
        
        print(f"Painel estrategico: PASS (saude_financeira={data['saude_financeira']})")


class TestImportarTransacoes:
    """Import transactions tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_conta_import(self, auth_headers):
        """Create test account for import"""
        response = requests.post(f"{BASE_URL}/api/church/fin/contas", headers=auth_headers, json={
            "nome": "TEST_Conta Importacao",
            "tipo": "banco",
            "saldo_inicial": 0
        })
        yield response.json()
    
    def test_import_transacoes(self, auth_headers, test_conta_import):
        """Test importing transactions via rows array"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/church/fin/importar", headers=auth_headers, json={
            "rows": [
                {"tipo": "receita", "valor": 100.00, "data": today, "descricao": "TEST_Import 1", "conta_id": test_conta_import["id"], "status": "confirmado"},
                {"tipo": "receita", "valor": 200.00, "data": today, "descricao": "TEST_Import 2", "conta_id": test_conta_import["id"], "status": "confirmado"},
                {"tipo": "despesa", "valor": 50.00, "data": today, "descricao": "TEST_Import 3", "conta_id": test_conta_import["id"], "status": "confirmado"},
            ]
        })
        assert response.status_code == 200
        data = response.json()
        assert "imported" in data
        assert data["imported"] == 3
        print(f"Import transacoes: PASS (imported={data['imported']})")
    
    def test_import_with_invalid_value(self, auth_headers, test_conta_import):
        """Test import rejects negative/zero values"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/church/fin/importar", headers=auth_headers, json={
            "rows": [
                {"tipo": "receita", "valor": 0, "data": today, "descricao": "TEST_Invalid", "conta_id": test_conta_import["id"]},
            ]
        })
        assert response.status_code == 200
        data = response.json()
        # Should have errors
        assert len(data.get("errors", [])) > 0
        print("Import with invalid value handled: PASS")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_cleanup_test_data(self, auth_headers):
        """Clean up TEST_ prefixed data"""
        # Clean up blocked periods
        periods = requests.get(f"{BASE_URL}/api/church/fin/periodos-bloqueados", headers=auth_headers).json()
        for p in periods:
            requests.delete(f"{BASE_URL}/api/church/fin/periodos-bloqueados/{p['id']}", headers=auth_headers)
        
        # Clean up categorias
        cats = requests.get(f"{BASE_URL}/api/church/fin/categorias", headers=auth_headers).json()
        for c in cats:
            if c["nome"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/church/fin/categorias/{c['id']}", headers=auth_headers)
        
        # Clean up centros custo
        ccs = requests.get(f"{BASE_URL}/api/church/fin/centros-custo", headers=auth_headers).json()
        for cc in ccs:
            if cc["nome"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/church/fin/centros-custo/{cc['id']}", headers=auth_headers)
        
        # Clean up contatos
        contatos = requests.get(f"{BASE_URL}/api/church/fin/contatos", headers=auth_headers).json()
        for c in contatos:
            if c["nome"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/church/fin/contatos/{c['id']}", headers=auth_headers)
        
        print("Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
