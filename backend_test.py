import requests
import sys
import json
from datetime import datetime

class ChurchSaaSTester:
    def __init__(self, base_url="https://iglesia-saas-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tenant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
            
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")
            
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                except:
                    response_data = response.text
                self.log_test(name, True, f"Status: {response.status_code}")
                return True, response_data
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code} - {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_seed_super_admin(self):
        """Test creating super admin"""
        success, response = self.run_test(
            "Seed Super Admin", 
            "POST", 
            "seed/super-admin", 
            200
        )
        return success

    def test_seed_plans(self):
        """Test seeding plans"""
        success, response = self.run_test(
            "Seed Plans", 
            "POST", 
            "seed/plans", 
            200
        )
        return success

    def test_login(self):
        """Test login with demo credentials"""
        success, response = self.run_test(
            "Login with Demo Credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@firmesnafe.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.tenant_id = response.get('user', {}).get('tenant_id')
            self.log_test("Token Extraction", True, "Token successfully obtained")
            return True
        else:
            self.log_test("Token Extraction", False, "No token in response")
            return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_super_admin_metrics(self):
        """Test super admin metrics"""
        if not self.token:
            self.log_test("Super Admin Metrics", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Super Admin Metrics",
            "GET",
            "admin/metrics",
            200
        )
        return success

    def test_list_tenants(self):
        """Test listing tenants (churches)"""
        if not self.token:
            self.log_test("List Tenants", False, "No token available")
            return False
            
        success, response = self.run_test(
            "List Tenants",
            "GET",
            "admin/tenants",
            200
        )
        return success

    def test_get_public_plans(self):
        """Test getting public plans"""
        success, response = self.run_test(
            "Get Public Plans",
            "GET",
            "plans",
            200
        )
        return success

    def test_create_tenant(self):
        """Test creating a new tenant (church)"""
        if not self.token:
            self.log_test("Create Tenant", False, "No token available")
            return False
            
        timestamp = datetime.now().strftime('%H%M%S')
        self.church_admin_email = f"admin.teste.{timestamp}@teste.com"
        self.church_admin_password = "senha123"
        
        tenant_data = {
            "name": f"Igreja Teste {timestamp}",
            "admin_email": self.church_admin_email,
            "admin_password": self.church_admin_password,
            "admin_name": "Admin Teste",
            "plan_type": "essential",
            "member_limit": 100
        }
        
        success, response = self.run_test(
            "Create Test Tenant",
            "POST",
            "admin/tenants",
            200,
            data=tenant_data
        )
        
        if success:
            self.test_tenant_id = response.get('id')
        
        return success

    def test_login_church_admin(self):
        """Test login with church admin credentials"""
        if not hasattr(self, 'church_admin_email'):
            self.log_test("Login Church Admin", False, "No church admin created")
            return False
            
        success, response = self.run_test(
            "Login Church Admin",
            "POST",
            "auth/login",
            200,
            data={"email": self.church_admin_email, "password": self.church_admin_password}
        )
        
        if success and 'token' in response:
            self.church_token = response['token']
            self.church_tenant_id = response.get('user', {}).get('tenant_id')
            self.log_test("Church Token Extraction", True, f"Token obtained for tenant: {self.church_tenant_id}")
            return True
        else:
            self.log_test("Church Token Extraction", False, "No token in response")
            return False

    def test_church_dashboard(self):
        """Test church dashboard - requires tenant context"""
        if not hasattr(self, 'church_token'):
            self.log_test("Church Dashboard", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
        
        success, response = self.run_test(
            "Church Dashboard",
            "GET",
            "church/dashboard",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_create_member(self):
        """Test creating a church member"""
        if not hasattr(self, 'church_token'):
            self.log_test("Create Member", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        member_data = {
            "name": "João da Silva",
            "email": "joao@exemplo.com",
            "phone": "(11) 99999-9999",
            "status": "member",
            "address": "Rua das Flores, 123"
        }
        
        success, response = self.run_test(
            "Create Member",
            "POST",
            "church/members",
            200,
            data=member_data
        )
        
        if success:
            self.test_member_id = response.get('id')
        
        # Restore original token
        self.token = original_token
        return success

    def test_list_members(self):
        """Test listing church members"""
        if not hasattr(self, 'church_token'):
            self.log_test("List Members", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        success, response = self.run_test(
            "List Members",
            "GET",
            "church/members",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_create_ministry(self):
        """Test creating a ministry"""
        if not hasattr(self, 'church_token'):
            self.log_test("Create Ministry", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        ministry_data = {
            "name": "Ministério de Louvor",
            "description": "Responsável pela música nos cultos",
            "goals": "Edificar através da adoração"
        }
        
        success, response = self.run_test(
            "Create Ministry",
            "POST",
            "church/ministries",
            200,
            data=ministry_data
        )
        
        if success:
            self.test_ministry_id = response.get('id')
        
        # Restore original token
        self.token = original_token
        return success

    def test_list_ministries(self):
        """Test listing ministries"""
        if not hasattr(self, 'church_token'):
            self.log_test("List Ministries", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        success, response = self.run_test(
            "List Ministries",
            "GET",
            "church/ministries",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_create_event(self):
        """Test creating an event"""
        if not hasattr(self, 'church_token'):
            self.log_test("Create Event", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        event_data = {
            "title": "Culto de Domingo",
            "description": "Culto principal da igreja",
            "event_date": "2024-03-15",
            "event_time": "19:00",
            "location": "Templo Principal"
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "church/events",
            200,
            data=event_data
        )
        
        if success:
            self.test_event_id = response.get('id')
        
        # Restore original token
        self.token = original_token
        return success

    def test_list_events(self):
        """Test listing events"""
        if not hasattr(self, 'church_token'):
            self.log_test("List Events", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        success, response = self.run_test(
            "List Events",
            "GET",
            "church/events",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_create_donation(self):
        """Test creating a donation"""
        if not hasattr(self, 'church_token'):
            self.log_test("Create Donation", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        donation_data = {
            "member_name": "João da Silva",
            "amount": 150.00,
            "donation_type": "tithe",
            "payment_method": "pix",
            "notes": "Dízimo de fevereiro"
        }
        
        success, response = self.run_test(
            "Create Donation",
            "POST",
            "church/donations",
            200,
            data=donation_data
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_list_donations(self):
        """Test listing donations"""
        if not hasattr(self, 'church_token'):
            self.log_test("List Donations", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        success, response = self.run_test(
            "List Donations",
            "GET",
            "church/donations",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_financial_summary(self):
        """Test financial summary"""
        if not hasattr(self, 'church_token'):
            self.log_test("Financial Summary", False, "No church admin token available")
            return False
        
        # Temporarily switch to church admin token
        original_token = self.token
        self.token = self.church_token
            
        success, response = self.run_test(
            "Financial Summary",
            "GET",
            "church/financial/summary",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Firmes na Fé - Church Management SaaS Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic health check
        self.test_health_check()
        
        # Seed data
        self.test_seed_super_admin()
        self.test_seed_plans()
        
        # Authentication
        if self.test_login():
            # User profile
            self.test_get_user_profile()
            
            # Super Admin functions
            self.test_super_admin_metrics()
            self.test_list_tenants()
            
            # Public endpoints
            self.test_get_public_plans()
            
            # Create a test church and admin
            if self.test_create_tenant():
                # Login with church admin
                if self.test_login_church_admin():
                    # Church management
                    self.test_church_dashboard()
                    
                    # Members
                    if self.test_create_member():
                        self.test_list_members()
                    
                    # Ministries
                    if self.test_create_ministry():
                        self.test_list_ministries()
                    
                    # Events
                    if self.test_create_event():
                        self.test_list_events()
                    
                    # Financial
                    if self.test_create_donation():
                        self.test_list_donations()
                        self.test_financial_summary()

        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests PASSED!")
            return 0
        else:
            failed_tests = [r for r in self.test_results if not r['success']]
            print(f"❌ {len(failed_tests)} tests FAILED:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            return 1

def main():
    tester = ChurchSaaSTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())