"""
Test suite for Firmes Groups Module
Tests all endpoints: group-categories CRUD, groups CRUD, group members, and strategic dashboard
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin.teste.154017@teste.com"
TEST_PASSWORD = "admin123"


class TestGroupsModule:
    """Tests for the Groups Module"""
    
    token = None
    category_id = None
    group_id = None
    member_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        if not TestGroupsModule.token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            assert response.status_code == 200, f"Login failed: {response.text}"
            data = response.json()
            TestGroupsModule.token = data["token"]
            print(f"✅ Logged in as {TEST_EMAIL}")
    
    def get_headers(self):
        return {"Authorization": f"Bearer {TestGroupsModule.token}", "Content-Type": "application/json"}
    
    # ==================== GROUP CATEGORIES TESTS ====================
    
    def test_01_create_group_category(self):
        """Test POST /api/church/group-categories"""
        response = requests.post(f"{BASE_URL}/api/church/group-categories", 
            json={"name": "TEST_Célula", "color": "#22c55e", "status": "active"},
            headers=self.get_headers()
        )
        assert response.status_code == 200, f"Create category failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Célula"
        assert data["color"] == "#22c55e"
        assert "id" in data
        TestGroupsModule.category_id = data["id"]
        print(f"✅ Created category: {data['name']} (ID: {data['id']})")
    
    def test_02_list_group_categories(self):
        """Test GET /api/church/group-categories"""
        response = requests.get(f"{BASE_URL}/api/church/group-categories", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify our created category exists
        found = any(c["id"] == TestGroupsModule.category_id for c in data)
        assert found, "Created category not found in list"
        print(f"✅ Listed {len(data)} categories")
    
    def test_03_update_group_category(self):
        """Test PUT /api/church/group-categories/{id}"""
        response = requests.put(
            f"{BASE_URL}/api/church/group-categories/{TestGroupsModule.category_id}",
            json={"name": "TEST_Célula_Updated", "color": "#3b82f6"},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/church/group-categories", headers=self.get_headers())
        categories = get_resp.json()
        updated = next((c for c in categories if c["id"] == TestGroupsModule.category_id), None)
        assert updated is not None
        assert updated["name"] == "TEST_Célula_Updated"
        print(f"✅ Updated category to: {updated['name']}")
    
    # ==================== GET A MEMBER FOR LEADER ASSIGNMENT ====================
    
    def test_04_get_member_for_leader(self):
        """Get an existing member to use as group leader"""
        response = requests.get(f"{BASE_URL}/api/church/members?per_page=5", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert "items" in data, "Expected pagination format with 'items'"
        members = data["items"]
        if len(members) > 0:
            TestGroupsModule.member_id = members[0]["id"]
            print(f"✅ Found member for leader: {members[0]['name']} (ID: {members[0]['id']})")
        else:
            print("⚠️ No members found, skipping leader assignment")
    
    # ==================== GROUPS TESTS ====================
    
    def test_05_create_group(self):
        """Test POST /api/church/groups"""
        payload = {
            "name": "TEST_Grupo Célula Centro",
            "description": "Célula localizada no centro da cidade",
            "category_id": TestGroupsModule.category_id,
            "leader_id": TestGroupsModule.member_id,
            "status": "active",
            "start_date": "2026-01-01"
        }
        response = requests.post(f"{BASE_URL}/api/church/groups", json=payload, headers=self.get_headers())
        assert response.status_code == 200, f"Create group failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Grupo Célula Centro"
        assert data["description"] == "Célula localizada no centro da cidade"
        assert "id" in data
        TestGroupsModule.group_id = data["id"]
        print(f"✅ Created group: {data['name']} (ID: {data['id']})")
    
    def test_06_list_groups(self):
        """Test GET /api/church/groups with no filters"""
        response = requests.get(f"{BASE_URL}/api/church/groups", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify our created group exists and has enriched data
        found = next((g for g in data if g["id"] == TestGroupsModule.group_id), None)
        assert found is not None, "Created group not found in list"
        # Check that enriched fields are present
        assert "member_count" in found
        assert "category_name" in found
        assert "leader_name" in found
        print(f"✅ Listed {len(data)} groups, created group has {found['member_count']} members")
    
    def test_07_list_groups_with_status_filter(self):
        """Test GET /api/church/groups?status=active"""
        response = requests.get(f"{BASE_URL}/api/church/groups?status=active", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert all(g["status"] == "active" for g in data)
        print(f"✅ Filtered by status=active: {len(data)} groups")
    
    def test_08_list_groups_with_category_filter(self):
        """Test GET /api/church/groups?category_id=..."""
        response = requests.get(f"{BASE_URL}/api/church/groups?category_id={TestGroupsModule.category_id}", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert all(g["category_id"] == TestGroupsModule.category_id for g in data if g["category_id"])
        print(f"✅ Filtered by category: {len(data)} groups")
    
    def test_09_list_groups_with_search(self):
        """Test GET /api/church/groups?search=..."""
        response = requests.get(f"{BASE_URL}/api/church/groups?search=TEST_Grupo", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Search should find our test group"
        print(f"✅ Search found {len(data)} groups")
    
    def test_10_get_group_detail(self):
        """Test GET /api/church/groups/{id}"""
        response = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestGroupsModule.group_id
        assert data["name"] == "TEST_Grupo Célula Centro"
        # Check that detailed fields are present
        assert "members" in data
        assert isinstance(data["members"], list)
        assert "member_count" in data
        print(f"✅ Got group detail with {data['member_count']} members")
    
    def test_11_update_group(self):
        """Test PUT /api/church/groups/{id}"""
        response = requests.put(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}",
            json={"description": "Célula atualizada - descrição modificada"},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        updated = get_resp.json()
        assert updated["description"] == "Célula atualizada - descrição modificada"
        print(f"✅ Updated group description")
    
    # ==================== GROUP MEMBERS TESTS ====================
    
    def test_12_add_members_to_group(self):
        """Test POST /api/church/groups/{id}/members"""
        if not TestGroupsModule.member_id:
            pytest.skip("No member available to add")
        
        response = requests.post(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}/members",
            json={"member_ids": [TestGroupsModule.member_id]},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert "added" in data
        print(f"✅ Added {data['added']} member(s) to group")
        
        # Verify member count increased
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        group = get_resp.json()
        assert group["member_count"] >= 1
        print(f"✅ Group now has {group['member_count']} member(s)")
    
    def test_13_add_duplicate_member_no_error(self):
        """Test adding same member again doesn't create duplicate"""
        if not TestGroupsModule.member_id:
            pytest.skip("No member available")
        
        # Add same member again
        response = requests.post(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}/members",
            json={"member_ids": [TestGroupsModule.member_id]},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        # Should report 0 added (no duplicates)
        assert data["added"] == 0
        print(f"✅ No duplicate added (added: {data['added']})")
    
    def test_14_remove_member_from_group(self):
        """Test DELETE /api/church/groups/{id}/members/{member_id}"""
        if not TestGroupsModule.member_id:
            pytest.skip("No member available")
        
        response = requests.delete(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}/members/{TestGroupsModule.member_id}",
            headers=self.get_headers()
        )
        assert response.status_code == 200
        print(f"✅ Removed member from group")
        
        # Verify member count decreased
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        group = get_resp.json()
        assert group["member_count"] == 0
        print(f"✅ Group now has {group['member_count']} member(s)")
    
    # ==================== STRATEGIC DASHBOARD TEST ====================
    
    def test_15_strategic_dashboard(self):
        """Test GET /api/church/groups/strategic-dashboard"""
        response = requests.get(f"{BASE_URL}/api/church/groups/strategic-dashboard", headers=self.get_headers())
        assert response.status_code == 200
        data = response.json()
        # Verify expected fields
        assert "total_groups" in data
        assert "total_closed" in data
        assert "total_participants" in data
        assert "by_category" in data
        assert "by_department" in data
        assert "ranking" in data
        print(f"✅ Strategic dashboard: {data['total_groups']} active groups, {data['total_participants']} participants")
    
    # ==================== ARCHIVE/CLOSE GROUP TEST ====================
    
    def test_16_archive_group(self):
        """Test closing/archiving a group"""
        response = requests.put(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}",
            json={"status": "closed"},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        # Verify status changed
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        group = get_resp.json()
        assert group["status"] == "closed"
        print(f"✅ Group status changed to 'closed'")
    
    def test_17_reactivate_group(self):
        """Test reactivating a closed group"""
        response = requests.put(
            f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}",
            json={"status": "active"},
            headers=self.get_headers()
        )
        assert response.status_code == 200
        # Verify status changed back
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        group = get_resp.json()
        assert group["status"] == "active"
        print(f"✅ Group status changed back to 'active'")
    
    # ==================== CLEANUP TESTS ====================
    
    def test_18_delete_group(self):
        """Test DELETE /api/church/groups/{id}"""
        response = requests.delete(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        assert response.status_code == 200
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/church/groups/{TestGroupsModule.group_id}", headers=self.get_headers())
        assert get_resp.status_code == 404
        print(f"✅ Deleted group")
    
    def test_19_delete_group_category(self):
        """Test DELETE /api/church/group-categories/{id}"""
        response = requests.delete(
            f"{BASE_URL}/api/church/group-categories/{TestGroupsModule.category_id}",
            headers=self.get_headers()
        )
        assert response.status_code == 200
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/church/group-categories", headers=self.get_headers())
        categories = get_resp.json()
        found = any(c["id"] == TestGroupsModule.category_id for c in categories)
        assert not found, "Deleted category still exists"
        print(f"✅ Deleted category")


class TestGroupsErrorHandling:
    """Test error handling for groups endpoints"""
    
    token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        if not TestGroupsErrorHandling.token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            TestGroupsErrorHandling.token = response.json()["token"]
    
    def get_headers(self):
        return {"Authorization": f"Bearer {TestGroupsErrorHandling.token}", "Content-Type": "application/json"}
    
    def test_get_nonexistent_group(self):
        """Test GET for non-existent group returns 404"""
        response = requests.get(f"{BASE_URL}/api/church/groups/nonexistent-id", headers=self.get_headers())
        assert response.status_code == 404
        print(f"✅ Non-existent group returns 404")
    
    def test_delete_nonexistent_group(self):
        """Test DELETE for non-existent group returns 404"""
        response = requests.delete(f"{BASE_URL}/api/church/groups/nonexistent-id", headers=self.get_headers())
        assert response.status_code == 404
        print(f"✅ Deleting non-existent group returns 404")
    
    def test_add_members_no_ids(self):
        """Test adding members with empty list returns 400"""
        # First create a temp group
        cat_resp = requests.post(f"{BASE_URL}/api/church/group-categories",
            json={"name": "TEMP_Cat", "color": "#000"},
            headers=self.get_headers()
        )
        cat_id = cat_resp.json()["id"]
        
        grp_resp = requests.post(f"{BASE_URL}/api/church/groups",
            json={"name": "TEMP_Group", "category_id": cat_id},
            headers=self.get_headers()
        )
        grp_id = grp_resp.json()["id"]
        
        # Try adding empty member list
        response = requests.post(
            f"{BASE_URL}/api/church/groups/{grp_id}/members",
            json={"member_ids": []},
            headers=self.get_headers()
        )
        assert response.status_code == 400
        print(f"✅ Adding empty member list returns 400")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/church/groups/{grp_id}", headers=self.get_headers())
        requests.delete(f"{BASE_URL}/api/church/group-categories/{cat_id}", headers=self.get_headers())
    
    def test_unauthorized_access(self):
        """Test accessing groups without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/church/groups")
        # Without auth header, should fail
        assert response.status_code in [401, 403, 422]  # 422 for missing auth header
        print(f"✅ Unauthorized access properly rejected (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
