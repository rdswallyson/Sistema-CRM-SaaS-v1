"""
Test suite for Firmes Church Management - Core CRUD Operations
Testing: Registration with tenant creation, Departments, Events, Groups, Group Categories
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://church-fix.preview.emergentagent.com')

# Test credentials - Church Admin with tenant_id
CHURCH_ADMIN_EMAIL = "admin.teste.154017@teste.com"
CHURCH_ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for church admin"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": CHURCH_ADMIN_EMAIL, "password": CHURCH_ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def headers(auth_token):
    """Headers with authorization"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ==================== REGISTRATION FLOW ====================
class TestRegistrationFlow:
    """Test registration with auto tenant creation"""

    def test_register_new_church_admin(self):
        """Register new church admin - should auto-create tenant"""
        timestamp = int(time.time())
        payload = {
            "email": f"test_reg_{timestamp}@test.com",
            "password": "test123",
            "name": f"Test Admin {timestamp}",
            "role": "admin_church",
            "church_name": f"Test Church {timestamp}"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=payload
        )
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        
        # Verify user has tenant_id (auto-created)
        user = data["user"]
        assert user["tenant_id"] is not None, "User should have tenant_id"
        assert user["email"] == payload["email"]
        assert user["role"] == "admin_church"
        print(f"✓ Registered new church admin with auto-created tenant: {user['tenant_id']}")

    def test_duplicate_email_rejected(self):
        """Test that duplicate email registration is rejected"""
        payload = {
            "email": CHURCH_ADMIN_EMAIL,  # Already exists
            "password": "test123",
            "name": "Duplicate Test",
            "role": "admin_church"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=payload
        )
        assert response.status_code == 400, "Duplicate email should be rejected"
        print("✓ Duplicate email correctly rejected")


# ==================== DEPARTMENTS CRUD ====================
class TestDepartments:
    """Departments CRUD tests"""
    created_dept_id = None

    def test_create_department(self, headers):
        """Create a new department"""
        payload = {
            "name": f"TEST_Department_{int(time.time())}",
            "description": "Test department for automated tests",
            "icon": "building",
            "status": "active"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/departments",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert "id" in data
        TestDepartments.created_dept_id = data["id"]
        print(f"✓ Created department: {data['name']} (id: {data['id']})")

    def test_list_departments(self, headers):
        """List all departments"""
        response = requests.get(
            f"{BASE_URL}/api/church/departments",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} departments")

    def test_get_department_by_id(self, headers):
        """Get department by ID"""
        if not TestDepartments.created_dept_id:
            pytest.skip("No department to fetch")
        
        response = requests.get(
            f"{BASE_URL}/api/church/departments/{TestDepartments.created_dept_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestDepartments.created_dept_id
        print(f"✓ Fetched department: {data['name']}")

    def test_update_department(self, headers):
        """Update a department"""
        if not TestDepartments.created_dept_id:
            pytest.skip("No department to update")
        
        payload = {
            "description": "Updated description",
            "status": "inactive"
        }
        response = requests.put(
            f"{BASE_URL}/api/church/departments/{TestDepartments.created_dept_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/church/departments/{TestDepartments.created_dept_id}",
            headers=headers
        )
        updated = get_response.json()
        assert updated["description"] == payload["description"]
        assert updated["status"] == "inactive"
        print(f"✓ Updated department to inactive status")

    def test_delete_department(self, headers):
        """Delete a department"""
        if not TestDepartments.created_dept_id:
            pytest.skip("No department to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/departments/{TestDepartments.created_dept_id}",
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/church/departments/{TestDepartments.created_dept_id}",
            headers=headers
        )
        assert get_response.status_code == 404
        print(f"✓ Deleted department and verified 404")


# ==================== EVENTS CRUD ====================
class TestEvents:
    """Events CRUD tests"""
    created_event_id = None

    def test_create_event(self, headers):
        """Create a new event"""
        future_date = (datetime.now() + timedelta(days=7)).isoformat()
        payload = {
            "title": f"TEST_Event_{int(time.time())}",
            "description": "Test event for automated tests",
            "date": future_date,
            "location": "Test Location",
            "event_type": "celebration"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/events",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["title"] == payload["title"]
        assert "id" in data
        TestEvents.created_event_id = data["id"]
        print(f"✓ Created event: {data['title']} (id: {data['id']})")

    def test_list_events(self, headers):
        """List all events"""
        response = requests.get(
            f"{BASE_URL}/api/church/events",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} events")

    def test_get_event_by_id(self, headers):
        """Get event by ID"""
        if not TestEvents.created_event_id:
            pytest.skip("No event to fetch")
        
        response = requests.get(
            f"{BASE_URL}/api/church/events/{TestEvents.created_event_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestEvents.created_event_id
        print(f"✓ Fetched event: {data['title']}")

    def test_update_event(self, headers):
        """Update an event"""
        if not TestEvents.created_event_id:
            pytest.skip("No event to update")
        
        payload = {
            "description": "Updated event description",
            "location": "New Location"
        }
        response = requests.put(
            f"{BASE_URL}/api/church/events/{TestEvents.created_event_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify update
        get_response = requests.get(
            f"{BASE_URL}/api/church/events/{TestEvents.created_event_id}",
            headers=headers
        )
        updated = get_response.json()
        assert updated["location"] == "New Location"
        print(f"✓ Updated event location")

    def test_delete_event(self, headers):
        """Delete an event"""
        if not TestEvents.created_event_id:
            pytest.skip("No event to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/events/{TestEvents.created_event_id}",
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/church/events/{TestEvents.created_event_id}",
            headers=headers
        )
        assert get_response.status_code == 404
        print(f"✓ Deleted event and verified 404")


# ==================== GROUP CATEGORIES CRUD ====================
class TestGroupCategories:
    """Group Categories CRUD tests"""
    created_cat_id = None

    def test_create_group_category(self, headers):
        """Create a new group category"""
        payload = {
            "name": f"TEST_GroupCat_{int(time.time())}",
            "description": "Test group category",
            "color": "#3498db"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/group-categories",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert "id" in data
        TestGroupCategories.created_cat_id = data["id"]
        print(f"✓ Created group category: {data['name']}")

    def test_list_group_categories(self, headers):
        """List all group categories"""
        response = requests.get(
            f"{BASE_URL}/api/church/group-categories",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} group categories")

    def test_update_group_category(self, headers):
        """Update a group category"""
        if not TestGroupCategories.created_cat_id:
            pytest.skip("No category to update")
        
        payload = {"description": "Updated description"}
        response = requests.put(
            f"{BASE_URL}/api/church/group-categories/{TestGroupCategories.created_cat_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Updated group category")

    def test_delete_group_category(self, headers):
        """Delete a group category"""
        if not TestGroupCategories.created_cat_id:
            pytest.skip("No category to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/group-categories/{TestGroupCategories.created_cat_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted group category")


# ==================== GROUPS CRUD ====================
class TestGroups:
    """Groups CRUD tests"""
    created_group_id = None

    def test_create_group(self, headers):
        """Create a new group"""
        payload = {
            "name": f"TEST_Group_{int(time.time())}",
            "description": "Test group for automated tests",
            "meeting_day": "segunda",
            "meeting_time": "19:00",
            "status": "active"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/groups",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert "id" in data
        TestGroups.created_group_id = data["id"]
        print(f"✓ Created group: {data['name']} (id: {data['id']})")

    def test_list_groups(self, headers):
        """List all groups"""
        response = requests.get(
            f"{BASE_URL}/api/church/groups",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} groups")

    def test_get_group_by_id(self, headers):
        """Get group by ID"""
        if not TestGroups.created_group_id:
            pytest.skip("No group to fetch")
        
        response = requests.get(
            f"{BASE_URL}/api/church/groups/{TestGroups.created_group_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestGroups.created_group_id
        print(f"✓ Fetched group: {data['name']}")

    def test_update_group(self, headers):
        """Update a group"""
        if not TestGroups.created_group_id:
            pytest.skip("No group to update")
        
        payload = {
            "description": "Updated group description",
            "status": "inactive"
        }
        response = requests.put(
            f"{BASE_URL}/api/church/groups/{TestGroups.created_group_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Updated group to inactive")

    def test_delete_group(self, headers):
        """Delete a group"""
        if not TestGroups.created_group_id:
            pytest.skip("No group to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/groups/{TestGroups.created_group_id}",
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/church/groups/{TestGroups.created_group_id}",
            headers=headers
        )
        assert get_response.status_code == 404
        print(f"✓ Deleted group and verified 404")


# ==================== CLEANUP ====================
class TestCleanup:
    """Cleanup test data"""

    def test_cleanup_test_departments(self, headers):
        """Remove test departments"""
        response = requests.get(f"{BASE_URL}/api/church/departments", headers=headers)
        if response.status_code == 200:
            for dept in response.json():
                if dept["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/church/departments/{dept['id']}", headers=headers)
        print("✓ Cleanup completed for test departments")

    def test_cleanup_test_events(self, headers):
        """Remove test events"""
        response = requests.get(f"{BASE_URL}/api/church/events", headers=headers)
        if response.status_code == 200:
            for event in response.json():
                if event["title"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/church/events/{event['id']}", headers=headers)
        print("✓ Cleanup completed for test events")

    def test_cleanup_test_groups(self, headers):
        """Remove test groups"""
        response = requests.get(f"{BASE_URL}/api/church/groups", headers=headers)
        if response.status_code == 200:
            for group in response.json():
                if group["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/church/groups/{group['id']}", headers=headers)
        print("✓ Cleanup completed for test groups")

    def test_cleanup_test_group_categories(self, headers):
        """Remove test group categories"""
        response = requests.get(f"{BASE_URL}/api/church/group-categories", headers=headers)
        if response.status_code == 200:
            for cat in response.json():
                if cat["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/church/group-categories/{cat['id']}", headers=headers)
        print("✓ Cleanup completed for test group categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
