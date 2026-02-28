"""
Test suite for Departments Module
Tests CRUD operations for departments, member linking, archive/unarchive, and migration
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CHURCH_ADMIN_EMAIL = "admin.teste.154017@teste.com"
CHURCH_ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for church admin"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": CHURCH_ADMIN_EMAIL,
        "password": CHURCH_ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_check(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_login_success(self, api_client):
        """Test church admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CHURCH_ADMIN_EMAIL,
            "password": CHURCH_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == CHURCH_ADMIN_EMAIL
        print("✓ Login successful")


class TestDepartmentsCRUD:
    """Test department CRUD operations"""
    
    def test_list_departments(self, authenticated_client):
        """Test GET /api/church/departments"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} departments")
    
    def test_list_departments_by_status_active(self, authenticated_client):
        """Test GET /api/church/departments?status=active"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments", params={"status": "active"})
        assert response.status_code == 200
        data = response.json()
        for dept in data:
            assert dept.get("status") == "active"
        print(f"✓ Listed {len(data)} active departments")
    
    def test_list_departments_by_status_archived(self, authenticated_client):
        """Test GET /api/church/departments?status=archived"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments", params={"status": "archived"})
        assert response.status_code == 200
        data = response.json()
        for dept in data:
            assert dept.get("status") == "archived"
        print(f"✓ Listed {len(data)} archived departments")
    
    def test_create_department(self, authenticated_client):
        """Test POST /api/church/departments"""
        unique_name = f"TEST_Dept_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "description": "Test department description",
            "icon": "building",
            "status": "active"
        }
        response = authenticated_client.post(f"{BASE_URL}/api/church/departments", json=payload)
        assert response.status_code == 200  # FastAPI returns 200 by default
        data = response.json()
        assert data["name"] == unique_name
        assert data["description"] == "Test department description"
        assert data["status"] == "active"
        assert "id" in data
        print(f"✓ Created department: {unique_name}")
        # Store for cleanup
        TestDepartmentsCRUD.created_dept_id = data["id"]
        TestDepartmentsCRUD.created_dept_name = unique_name
        return data["id"]
    
    def test_get_department(self, authenticated_client):
        """Test GET /api/church/departments/{dept_id}"""
        dept_id = getattr(TestDepartmentsCRUD, 'created_dept_id', None)
        if not dept_id:
            pytest.skip("No department created")
        
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == dept_id
        assert "name" in data
        assert "members" in data  # Should include members list
        print(f"✓ Got department details: {data['name']}")
    
    def test_update_department(self, authenticated_client):
        """Test PUT /api/church/departments/{dept_id}"""
        dept_id = getattr(TestDepartmentsCRUD, 'created_dept_id', None)
        if not dept_id:
            pytest.skip("No department created")
        
        new_description = "Updated description"
        payload = {"description": new_description}
        response = authenticated_client.put(f"{BASE_URL}/api/church/departments/{dept_id}", json=payload)
        assert response.status_code == 200
        
        # Verify update
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["description"] == new_description
        print(f"✓ Updated department description")
    
    def test_archive_department(self, authenticated_client):
        """Test archiving a department via PUT"""
        dept_id = getattr(TestDepartmentsCRUD, 'created_dept_id', None)
        if not dept_id:
            pytest.skip("No department created")
        
        payload = {"status": "archived"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/departments/{dept_id}", json=payload)
        assert response.status_code == 200
        
        # Verify archive
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["status"] == "archived"
        print(f"✓ Archived department")
    
    def test_unarchive_department(self, authenticated_client):
        """Test reactivating a department via PUT"""
        dept_id = getattr(TestDepartmentsCRUD, 'created_dept_id', None)
        if not dept_id:
            pytest.skip("No department created")
        
        payload = {"status": "active"}
        response = authenticated_client.put(f"{BASE_URL}/api/church/departments/{dept_id}", json=payload)
        assert response.status_code == 200
        
        # Verify reactivate
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["status"] == "active"
        print(f"✓ Reactivated department")


class TestDepartmentMembers:
    """Test department member operations"""
    
    @pytest.fixture(autouse=True)
    def setup_test_department(self, authenticated_client):
        """Create a test department for member tests"""
        unique_name = f"TEST_DeptMembers_{uuid.uuid4().hex[:8]}"
        payload = {"name": unique_name, "status": "active"}
        response = authenticated_client.post(f"{BASE_URL}/api/church/departments", json=payload)
        assert response.status_code == 200
        self.dept_id = response.json()["id"]
        yield
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/church/departments/{self.dept_id}")
    
    def test_get_members_list_for_selection(self, authenticated_client):
        """Test GET /api/church/members to get members for selection"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/members", params={"per_page": 50})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"✓ Got {len(data['items'])} members for selection")
        # Store first member for adding to department
        if data["items"]:
            TestDepartmentMembers.test_member_id = data["items"][0]["id"]
            TestDepartmentMembers.test_member_name = data["items"][0]["name"]
    
    def test_add_members_to_department(self, authenticated_client):
        """Test POST /api/church/departments/{dept_id}/members"""
        member_id = getattr(TestDepartmentMembers, 'test_member_id', None)
        if not member_id:
            pytest.skip("No member available for testing")
        
        payload = {"member_ids": [member_id]}
        response = authenticated_client.post(
            f"{BASE_URL}/api/church/departments/{self.dept_id}/members",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "added" in data
        print(f"✓ Added member to department: {data}")
    
    def test_add_duplicate_member_no_duplicate(self, authenticated_client):
        """Test that adding same member twice doesn't create duplicate"""
        member_id = getattr(TestDepartmentMembers, 'test_member_id', None)
        if not member_id:
            pytest.skip("No member available for testing")
        
        # First add
        payload = {"member_ids": [member_id]}
        authenticated_client.post(f"{BASE_URL}/api/church/departments/{self.dept_id}/members", json=payload)
        
        # Second add (should not create duplicate)
        response = authenticated_client.post(
            f"{BASE_URL}/api/church/departments/{self.dept_id}/members",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        # Should report 0 added (already exists)
        assert data.get("added") == 0
        print(f"✓ No duplicate created when adding same member twice")
    
    def test_get_department_members(self, authenticated_client):
        """Test GET /api/church/departments/{dept_id}/members"""
        member_id = getattr(TestDepartmentMembers, 'test_member_id', None)
        if not member_id:
            pytest.skip("No member available for testing")
        
        # Add member first
        payload = {"member_ids": [member_id]}
        authenticated_client.post(f"{BASE_URL}/api/church/departments/{self.dept_id}/members", json=payload)
        
        # Get members
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{self.dept_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        member_ids_in_dept = [m["id"] for m in data]
        assert member_id in member_ids_in_dept
        print(f"✓ Got {len(data)} members in department")
    
    def test_remove_member_from_department(self, authenticated_client):
        """Test DELETE /api/church/departments/{dept_id}/members/{member_id}"""
        member_id = getattr(TestDepartmentMembers, 'test_member_id', None)
        if not member_id:
            pytest.skip("No member available for testing")
        
        # Add member first
        payload = {"member_ids": [member_id]}
        authenticated_client.post(f"{BASE_URL}/api/church/departments/{self.dept_id}/members", json=payload)
        
        # Remove member
        response = authenticated_client.delete(
            f"{BASE_URL}/api/church/departments/{self.dept_id}/members/{member_id}"
        )
        assert response.status_code == 200
        
        # Verify removal
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{self.dept_id}/members")
        data = get_response.json()
        member_ids_in_dept = [m["id"] for m in data]
        assert member_id not in member_ids_in_dept
        print(f"✓ Removed member from department")


class TestDepartmentDashboard:
    """Test department dashboard API"""
    
    def test_dashboard_includes_departments(self, authenticated_client):
        """Test that dashboard includes total_departments"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_departments" in data or "total_ministries" in data
        dept_count = data.get("total_departments") or data.get("total_ministries", 0)
        print(f"✓ Dashboard shows {dept_count} departments")


class TestMigration:
    """Test migration endpoint"""
    
    def test_migration_endpoint(self, authenticated_client):
        """Test POST /api/migrate/ministries-to-departments"""
        response = authenticated_client.post(f"{BASE_URL}/api/migrate/ministries-to-departments")
        assert response.status_code == 200
        data = response.json()
        assert "migrated" in data
        print(f"✓ Migration endpoint works: {data}")


class TestDeleteDepartment:
    """Test department deletion (run last to cleanup)"""
    
    def test_delete_department(self, authenticated_client):
        """Test DELETE /api/church/departments/{dept_id}"""
        dept_id = getattr(TestDepartmentsCRUD, 'created_dept_id', None)
        if not dept_id:
            pytest.skip("No department to delete")
        
        response = authenticated_client.delete(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = authenticated_client.get(f"{BASE_URL}/api/church/departments/{dept_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted department")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_departments(self, authenticated_client):
        """Remove any remaining TEST_ departments"""
        response = authenticated_client.get(f"{BASE_URL}/api/church/departments")
        if response.status_code == 200:
            depts = response.json()
            for dept in depts:
                if dept.get("name", "").startswith("TEST_"):
                    authenticated_client.delete(f"{BASE_URL}/api/church/departments/{dept['id']}")
                    print(f"  Cleaned up: {dept['name']}")
        print("✓ Cleanup complete")
