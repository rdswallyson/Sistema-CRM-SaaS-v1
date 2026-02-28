"""
Ensino (Teaching) Module Tests
Tests for: Estudos, Escolas, Turmas, Progresso Ensino, and Painel Academico
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin.teste.154017@teste.com"
TEST_PASSWORD = "admin123"

# Store IDs for cleanup
created_ids = {
    'escola': None,
    'turma': None,
    'estudo': None,
    'progresso': None,
    'member_id': None,
}


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, f"No token in response: {data}"
    return data["token"]


@pytest.fixture(scope="module")
def authenticated_client(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


@pytest.fixture(scope="module")
def member_id(authenticated_client):
    """Get first available member ID for tests"""
    response = authenticated_client.get(f"{BASE_URL}/api/church/members", params={"per_page": 5})
    if response.status_code == 200:
        data = response.json()
        items = data.get("items", [])
        if items:
            return items[0]["id"]
    pytest.skip("No members available for testing")


# ==================== ESCOLAS (SCHOOLS) TESTS ====================
class TestEscolas:
    """Tests for Escolas (Schools) CRUD"""

    def test_01_create_escola(self, authenticated_client):
        """Test creating a new escola"""
        payload = {
            "nome": "TEST_Escola de Lideres 2026",
            "descricao": "Escola de formacao de lideranca",
            "status": "active"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/church/escolas", json=payload)
        assert response.status_code == 200, f"Create escola failed: {response.text}"
        data = response.json()
        assert data["nome"] == payload["nome"]
        assert "id" in data
        created_ids['escola'] = data["id"]
        print(f"Created escola: {data['id']}")

    def test_02_list_escolas(self, authenticated_client):
        """Test listing escolas"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/escolas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} escolas")

    def test_03_get_escola(self, authenticated_client):
        """Test getting single escola"""
        if not created_ids['escola']:
            pytest.skip("No escola created")
        response = authenticated_client.get(f"{BASE_URL}/api/church/escolas/{created_ids['escola']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_ids['escola']
        assert data["nome"] == "TEST_Escola de Lideres 2026"

    def test_04_update_escola(self, authenticated_client):
        """Test updating escola"""
        if not created_ids['escola']:
            pytest.skip("No escola created")
        payload = {"descricao": "Descricao atualizada"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/escolas/{created_ids['escola']}", json=payload)
        assert response.status_code == 200
        # Verify update persisted
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/escolas/{created_ids['escola']}")
        assert get_response.status_code == 200
        assert get_response.json()["descricao"] == "Descricao atualizada"

    def test_05_search_escolas(self, authenticated_client):
        """Test searching escolas"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/escolas", params={"search": "TEST_"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ==================== TURMAS (CLASSES) TESTS ====================
class TestTurmas:
    """Tests for Turmas (Classes) CRUD"""

    def test_01_create_turma(self, authenticated_client):
        """Test creating a new turma"""
        payload = {
            "nome": "TEST_Turma de Lideres Q1 2026",
            "escola_id": created_ids['escola'] or "",
            "data_inicio": "2026-01-15",
            "status": "active"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/church/turmas", json=payload)
        assert response.status_code == 200, f"Create turma failed: {response.text}"
        data = response.json()
        assert data["nome"] == payload["nome"]
        assert "id" in data
        created_ids['turma'] = data["id"]
        print(f"Created turma: {data['id']}")

    def test_02_list_turmas(self, authenticated_client):
        """Test listing turmas"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} turmas")

    def test_03_list_turmas_with_filters(self, authenticated_client):
        """Test listing turmas with status filter"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas", params={"status": "active"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for t in data:
            assert t["status"] == "active"

    def test_04_get_turma_detail(self, authenticated_client):
        """Test getting turma detail with alunos"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_ids['turma']
        assert "alunos" in data
        assert "aluno_count" in data

    def test_05_update_turma(self, authenticated_client):
        """Test updating turma"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        payload = {"data_fim": "2026-06-30"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}", json=payload)
        assert response.status_code == 200
        # Verify update
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}")
        assert get_response.status_code == 200
        assert get_response.json()["data_fim"] == "2026-06-30"

    def test_06_add_members_to_turma(self, authenticated_client, member_id):
        """Test adding members to turma"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        payload = {"member_ids": [member_id]}
        response = authenticated_client.post(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}/membros", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "added" in data or "message" in data
        created_ids['member_id'] = member_id
        print(f"Added member {member_id} to turma")

    def test_07_verify_member_in_turma(self, authenticated_client, member_id):
        """Verify member was added to turma"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}")
        assert response.status_code == 200
        data = response.json()
        assert data["aluno_count"] >= 1
        member_ids = [a["id"] for a in data.get("alunos", [])]
        assert member_id in member_ids

    def test_08_add_empty_members_fails(self, authenticated_client):
        """Test adding empty member list fails with 400"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        payload = {"member_ids": []}
        response = authenticated_client.post(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}/membros", json=payload)
        assert response.status_code == 400

    def test_09_remove_member_from_turma(self, authenticated_client, member_id):
        """Test removing member from turma"""
        if not created_ids['turma']:
            pytest.skip("No turma created")
        response = authenticated_client.delete(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}/membros/{member_id}")
        assert response.status_code == 200

    def test_10_filter_by_escola(self, authenticated_client):
        """Test filtering turmas by escola_id"""
        if not created_ids['escola']:
            pytest.skip("No escola created")
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas", params={"escola_id": created_ids['escola']})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ==================== ESTUDOS (STUDIES) TESTS ====================
class TestEstudos:
    """Tests for Estudos (Studies) CRUD"""

    def test_01_create_estudo(self, authenticated_client):
        """Test creating a new estudo"""
        payload = {
            "titulo": "TEST_Fundamentos da Fe",
            "descricao": "Estudo basico sobre fundamentos",
            "categoria": "Teologia",
            "nivel": "basico",
            "status": "active",
            "escola_id": created_ids['escola'] or "",
            "turma_id": created_ids['turma'] or ""
        }
        response = authenticated_client.post(f"{BASE_URL}/api/church/estudos", json=payload)
        assert response.status_code == 200, f"Create estudo failed: {response.text}"
        data = response.json()
        assert data["titulo"] == payload["titulo"]
        assert data["nivel"] == "basico"
        assert "id" in data
        created_ids['estudo'] = data["id"]
        print(f"Created estudo: {data['id']}")

    def test_02_list_estudos(self, authenticated_client):
        """Test listing estudos"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/estudos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Listed {len(data)} estudos")

    def test_03_list_estudos_with_filters(self, authenticated_client):
        """Test listing estudos with level filter"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/estudos", params={"nivel": "basico"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for e in data:
            assert e["nivel"] == "basico"

    def test_04_get_estudo(self, authenticated_client):
        """Test getting single estudo"""
        if not created_ids['estudo']:
            pytest.skip("No estudo created")
        response = authenticated_client.get(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_ids['estudo']
        assert data["titulo"] == "TEST_Fundamentos da Fe"

    def test_05_update_estudo(self, authenticated_client):
        """Test updating estudo"""
        if not created_ids['estudo']:
            pytest.skip("No estudo created")
        payload = {"descricao": "Descricao atualizada do estudo"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}", json=payload)
        assert response.status_code == 200
        # Verify update
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}")
        assert get_response.status_code == 200
        assert get_response.json()["descricao"] == "Descricao atualizada do estudo"

    def test_06_archive_estudo(self, authenticated_client):
        """Test archiving estudo"""
        if not created_ids['estudo']:
            pytest.skip("No estudo created")
        payload = {"status": "archived"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}", json=payload)
        assert response.status_code == 200
        # Verify archived
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "archived"
        # Reactivate for later tests
        authenticated_client.put(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}", json={"status": "active"})

    def test_07_search_estudos(self, authenticated_client):
        """Test searching estudos"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/estudos", params={"search": "TEST_"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ==================== PROGRESSO ENSINO TESTS ====================
class TestProgressoEnsino:
    """Tests for Progresso Ensino (Teaching Progress)"""

    def test_01_create_progresso(self, authenticated_client, member_id):
        """Test creating a progresso record"""
        payload = {
            "membro_id": member_id,
            "turma_id": created_ids['turma'] or "",
            "estudo_id": created_ids['estudo'] or "",
            "status": "em_andamento",
            "nota": 8.5,
            "observacao": "Aluno muito dedicado"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/church/progresso-ensino", json=payload)
        assert response.status_code == 200, f"Create progresso failed: {response.text}"
        data = response.json()
        assert data["membro_id"] == member_id
        assert data["status"] == "em_andamento"
        assert "id" in data
        created_ids['progresso'] = data["id"]
        created_ids['member_id'] = member_id
        print(f"Created progresso: {data['id']}")

    def test_02_get_progresso_membro(self, authenticated_client, member_id):
        """Test getting member's progress"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/progresso-ensino/membro/{member_id}")
        assert response.status_code == 200
        data = response.json()
        assert "progressos" in data
        assert "member" in data
        assert isinstance(data["progressos"], list)

    def test_03_update_progresso(self, authenticated_client):
        """Test updating progresso"""
        if not created_ids['progresso']:
            pytest.skip("No progresso created")
        payload = {"status": "concluido", "nota": 9.0}
        response = authenticated_client.put(f"{BASE_URL}/api/church/progresso-ensino/{created_ids['progresso']}", json=payload)
        assert response.status_code == 200


# ==================== PAINEL ACADEMICO TESTS ====================
class TestPainelAcademico:
    """Tests for Academic Dashboard"""

    def test_01_get_painel_academico(self, authenticated_client):
        """Test getting academic dashboard data"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/ensino/painel-academico")
        assert response.status_code == 200
        data = response.json()
        # Verify all expected fields
        expected_fields = [
            "total_escolas", "total_turmas", "total_turmas_concluidas",
            "total_estudos", "total_alunos", "taxa_conclusao",
            "escola_stats", "turma_ranking", "by_nivel"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        # Verify data types
        assert isinstance(data["total_escolas"], int)
        assert isinstance(data["total_turmas"], int)
        assert isinstance(data["escola_stats"], list)
        assert isinstance(data["turma_ranking"], list)
        print(f"Dashboard: {data['total_escolas']} escolas, {data['total_turmas']} turmas, {data['total_alunos']} alunos")


# ==================== ERROR HANDLING TESTS ====================
class TestErrorHandling:
    """Tests for error handling"""

    def test_01_get_nonexistent_escola(self, authenticated_client):
        """Test 404 for nonexistent escola"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/escolas/nonexistent-id")
        assert response.status_code == 404

    def test_02_get_nonexistent_turma(self, authenticated_client):
        """Test 404 for nonexistent turma"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/turmas/nonexistent-id")
        assert response.status_code == 404

    def test_03_get_nonexistent_estudo(self, authenticated_client):
        """Test 404 for nonexistent estudo"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/estudos/nonexistent-id")
        assert response.status_code == 404

    def test_04_unauthorized_access(self):
        """Test 401 for unauthorized access"""
        response = requests.get(f"{BASE_URL}/api/church/escolas")
        assert response.status_code in [401, 403]


# ==================== CLEANUP ====================
class TestCleanup:
    """Cleanup test data"""

    def test_01_delete_progresso(self, authenticated_client):
        """Delete test progresso"""
        if created_ids['progresso']:
            response = authenticated_client.delete(f"{BASE_URL}/api/church/progresso-ensino/{created_ids['progresso']}")
            assert response.status_code == 200
            print(f"Deleted progresso: {created_ids['progresso']}")

    def test_02_delete_estudo(self, authenticated_client):
        """Delete test estudo"""
        if created_ids['estudo']:
            response = authenticated_client.delete(f"{BASE_URL}/api/church/estudos/{created_ids['estudo']}")
            assert response.status_code == 200
            print(f"Deleted estudo: {created_ids['estudo']}")

    def test_03_delete_turma(self, authenticated_client):
        """Delete test turma"""
        if created_ids['turma']:
            response = authenticated_client.delete(f"{BASE_URL}/api/church/turmas/{created_ids['turma']}")
            assert response.status_code == 200
            print(f"Deleted turma: {created_ids['turma']}")

    def test_04_delete_escola(self, authenticated_client):
        """Delete test escola"""
        if created_ids['escola']:
            response = authenticated_client.delete(f"{BASE_URL}/api/church/escolas/{created_ids['escola']}")
            assert response.status_code == 200
            print(f"Deleted escola: {created_ids['escola']}")
