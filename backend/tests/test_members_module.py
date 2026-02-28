"""
Test suite for Firmes Church Management - Members Module APIs
Testing: Categories, Positions, Custom Fields, Menu Customization, Members CRUD, Birthdays
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://firmes-grupos.preview.emergentagent.com')

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


# ==================== HEALTH CHECK ====================
class TestHealthCheck:
    """Basic API health tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")

    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Firmes" in data.get("message", "")
        print("✓ API root endpoint working")


# ==================== AUTHENTICATION ====================
class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_church_admin(self):
        """Test church admin login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CHURCH_ADMIN_EMAIL, "password": CHURCH_ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == CHURCH_ADMIN_EMAIL
        assert data["user"]["tenant_id"] is not None  # Church admin must have tenant_id
        print(f"✓ Church admin login successful - tenant_id: {data['user']['tenant_id']}")

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


# ==================== MEMBER CATEGORIES CRUD ====================
class TestMemberCategories:
    """Member Categories CRUD tests"""
    created_category_id = None

    def test_create_category(self, headers):
        """Create a new member category"""
        payload = {
            "name": f"TEST_Category_{int(time.time())}",
            "description": "Test category for automated tests",
            "color": "#ff5733"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/member-categories",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["color"] == payload["color"]
        assert "id" in data
        TestMemberCategories.created_category_id = data["id"]
        print(f"✓ Created category: {data['name']} (id: {data['id']})")

    def test_list_categories(self, headers):
        """List all member categories"""
        response = requests.get(
            f"{BASE_URL}/api/church/member-categories",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} categories")

    def test_update_category(self, headers):
        """Update a member category"""
        if not TestMemberCategories.created_category_id:
            pytest.skip("No category to update")
        
        payload = {"description": "Updated description"}
        response = requests.put(
            f"{BASE_URL}/api/church/member-categories/{TestMemberCategories.created_category_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Updated category {TestMemberCategories.created_category_id}")

    def test_delete_category(self, headers):
        """Delete a member category"""
        if not TestMemberCategories.created_category_id:
            pytest.skip("No category to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/member-categories/{TestMemberCategories.created_category_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted category {TestMemberCategories.created_category_id}")


# ==================== MEMBER POSITIONS (CARGOS) CRUD ====================
class TestMemberPositions:
    """Member Positions CRUD tests"""
    created_position_id = None

    def test_create_position(self, headers):
        """Create a new member position"""
        payload = {
            "name": f"TEST_Position_{int(time.time())}",
            "description": "Test position for automated tests",
            "hierarchy_level": 5
        }
        response = requests.post(
            f"{BASE_URL}/api/church/member-positions",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["hierarchy_level"] == payload["hierarchy_level"]
        assert "id" in data
        TestMemberPositions.created_position_id = data["id"]
        print(f"✓ Created position: {data['name']} (level: {data['hierarchy_level']})")

    def test_list_positions(self, headers):
        """List all member positions"""
        response = requests.get(
            f"{BASE_URL}/api/church/member-positions",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} positions")

    def test_update_position(self, headers):
        """Update a member position"""
        if not TestMemberPositions.created_position_id:
            pytest.skip("No position to update")
        
        payload = {"hierarchy_level": 10}
        response = requests.put(
            f"{BASE_URL}/api/church/member-positions/{TestMemberPositions.created_position_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Updated position {TestMemberPositions.created_position_id}")

    def test_delete_position(self, headers):
        """Delete a member position"""
        if not TestMemberPositions.created_position_id:
            pytest.skip("No position to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/member-positions/{TestMemberPositions.created_position_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted position {TestMemberPositions.created_position_id}")


# ==================== CUSTOM FIELDS CRUD ====================
class TestCustomFields:
    """Custom Fields CRUD tests"""
    created_field_id = None

    def test_create_text_field(self, headers):
        """Create a text custom field"""
        payload = {
            "name": f"TEST_TextField_{int(time.time())}",
            "field_type": "text",
            "is_required": False,
            "is_active": True,
            "order": 0
        }
        response = requests.post(
            f"{BASE_URL}/api/church/custom-fields",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["field_type"] == "text"
        TestCustomFields.created_field_id = data["id"]
        print(f"✓ Created text field: {data['name']}")

    def test_create_select_field(self, headers):
        """Create a select custom field with options"""
        payload = {
            "name": f"TEST_SelectField_{int(time.time())}",
            "field_type": "select",
            "options": ["Option A", "Option B", "Option C"],
            "is_required": True,
            "is_active": True,
            "order": 1
        }
        response = requests.post(
            f"{BASE_URL}/api/church/custom-fields",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["field_type"] == "select"
        assert len(data["options"]) == 3
        print(f"✓ Created select field with {len(data['options'])} options")

    def test_list_custom_fields(self, headers):
        """List all custom fields"""
        response = requests.get(
            f"{BASE_URL}/api/church/custom-fields",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} custom fields")

    def test_update_custom_field(self, headers):
        """Update a custom field - toggle active state"""
        if not TestCustomFields.created_field_id:
            pytest.skip("No field to update")
        
        payload = {"is_active": False}
        response = requests.put(
            f"{BASE_URL}/api/church/custom-fields/{TestCustomFields.created_field_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Updated custom field to inactive")

    def test_delete_custom_field(self, headers):
        """Delete a custom field"""
        if not TestCustomFields.created_field_id:
            pytest.skip("No field to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/custom-fields/{TestCustomFields.created_field_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted custom field {TestCustomFields.created_field_id}")


# ==================== MENU CUSTOMIZATION ====================
class TestMenuCustomization:
    """Menu Customization tests"""

    def test_get_menu_customization(self, headers):
        """Get current menu customization"""
        response = requests.get(
            f"{BASE_URL}/api/church/menu-customization",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} menu customization items")

    def test_update_menu_customization(self, headers):
        """Update menu labels"""
        payload = [
            {"menu_key": "members_main", "display_name": "Membros"},
            {"menu_key": "members_list", "display_name": "Ver todos"}
        ]
        response = requests.put(
            f"{BASE_URL}/api/church/menu-customization",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Updated menu customization")


# ==================== MEMBERS CRUD ====================
class TestMembers:
    """Members CRUD tests"""
    created_member_id = None

    def test_create_member(self, headers):
        """Create a new member"""
        payload = {
            "name": f"TEST_Member_{int(time.time())}",
            "email": f"test.member.{int(time.time())}@test.com",
            "phone": "(11) 99999-9999",
            "birth_date": "1990-06-15",
            "status": "visitor",
            "notes": "Test member created by automated tests"
        }
        response = requests.post(
            f"{BASE_URL}/api/church/members",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        TestMembers.created_member_id = data["id"]
        print(f"✓ Created member: {data['name']} (id: {data['id']})")

    def test_list_members_paginated(self, headers):
        """List members with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/church/members",
            params={"page": 1, "per_page": 10},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        # Check pagination response format
        assert "items" in data, "Response should have 'items' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        assert "pages" in data, "Response should have 'pages' key"
        assert isinstance(data["items"], list)
        print(f"✓ Listed {len(data['items'])} members (total: {data['total']}, page {data['page']}/{data['pages']})")

    def test_list_members_with_search(self, headers):
        """List members with search filter"""
        response = requests.get(
            f"{BASE_URL}/api/church/members",
            params={"search": "TEST_"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ Search returned {len(data['items'])} results")

    def test_list_members_with_status_filter(self, headers):
        """List members filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/church/members",
            params={"status": "visitor"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        # Verify all returned members have the correct status
        for member in data["items"]:
            assert member["status"] == "visitor"
        print(f"✓ Status filter returned {len(data['items'])} visitors")

    def test_get_member_by_id(self, headers):
        """Get a single member by ID"""
        if not TestMembers.created_member_id:
            pytest.skip("No member to fetch")
        
        response = requests.get(
            f"{BASE_URL}/api/church/members/{TestMembers.created_member_id}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestMembers.created_member_id
        print(f"✓ Fetched member: {data['name']}")

    def test_update_member(self, headers):
        """Update a member"""
        if not TestMembers.created_member_id:
            pytest.skip("No member to update")
        
        payload = {
            "status": "member",
            "notes": "Updated by automated test"
        }
        response = requests.put(
            f"{BASE_URL}/api/church/members/{TestMembers.created_member_id}",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify update by fetching again
        get_response = requests.get(
            f"{BASE_URL}/api/church/members/{TestMembers.created_member_id}",
            headers=headers
        )
        updated_data = get_response.json()
        assert updated_data["status"] == "member"
        print(f"✓ Updated member status to 'member'")

    def test_delete_member(self, headers):
        """Delete a member"""
        if not TestMembers.created_member_id:
            pytest.skip("No member to delete")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/members/{TestMembers.created_member_id}",
            headers=headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/church/members/{TestMembers.created_member_id}",
            headers=headers
        )
        assert get_response.status_code == 404
        print(f"✓ Deleted member and verified 404")


# ==================== MEMBER BIRTHDAYS ====================
class TestMemberBirthdays:
    """Member birthdays endpoint tests"""

    def test_get_birthdays_current_month(self, headers):
        """Get birthdays for current month"""
        current_month = datetime.now().month
        response = requests.get(
            f"{BASE_URL}/api/church/members/birthdays",
            params={"month": current_month},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} birthdays for month {current_month}")

    def test_get_birthdays_specific_month(self, headers):
        """Get birthdays for a specific month (June)"""
        response = requests.get(
            f"{BASE_URL}/api/church/members/birthdays",
            params={"month": 6},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify all returned members have birthday in June
        for member in data:
            if member.get("birth_date"):
                month = int(member["birth_date"].split("-")[1])
                assert month == 6, f"Member {member['name']} has birthday in wrong month: {month}"
        print(f"✓ Got {len(data)} birthdays for June")


# ==================== CLEANUP ====================
class TestCleanup:
    """Cleanup any remaining test data"""
    
    def test_cleanup_test_categories(self, headers):
        """Remove test categories"""
        response = requests.get(
            f"{BASE_URL}/api/church/member-categories",
            headers=headers
        )
        if response.status_code == 200:
            for cat in response.json():
                if cat["name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/church/member-categories/{cat['id']}",
                        headers=headers
                    )
        print("✓ Cleanup completed for test categories")

    def test_cleanup_test_positions(self, headers):
        """Remove test positions"""
        response = requests.get(
            f"{BASE_URL}/api/church/member-positions",
            headers=headers
        )
        if response.status_code == 200:
            for pos in response.json():
                if pos["name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/church/member-positions/{pos['id']}",
                        headers=headers
                    )
        print("✓ Cleanup completed for test positions")

    def test_cleanup_test_fields(self, headers):
        """Remove test custom fields"""
        response = requests.get(
            f"{BASE_URL}/api/church/custom-fields",
            headers=headers
        )
        if response.status_code == 200:
            for field in response.json():
                if field["name"].startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/church/custom-fields/{field['id']}",
                        headers=headers
                    )
        print("✓ Cleanup completed for test custom fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
