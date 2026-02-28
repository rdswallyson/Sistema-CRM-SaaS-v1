import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { Toaster } from "./components/ui/sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import ChurchesManagement from "./pages/admin/ChurchesManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import ChurchDashboard from "./pages/church/ChurchDashboard";
import MemberProfilePage from "./pages/church/MemberProfilePage";
import DepartmentsPage from "./pages/church/DepartmentsPage";
import DepartmentDetailPage from "./pages/church/DepartmentDetailPage";

// Groups Pages
import GroupsList from "./pages/church/groups/GroupsList";
import AddGroup from "./pages/church/groups/AddGroup";
import GroupCategories from "./pages/church/groups/GroupCategories";
import GroupReports from "./pages/church/groups/GroupReports";
import GroupExport from "./pages/church/groups/GroupExport";
import GroupStrategicPanel from "./pages/church/groups/GroupStrategicPanel";
import GroupDetailPage from "./pages/church/groups/GroupDetailPage";
import EventsPage from "./pages/church/EventsPage";
import FinancialPage from "./pages/church/FinancialPage";
import CommunicationPage from "./pages/church/CommunicationPage";
import DiscipleshipPage from "./pages/church/DiscipleshipPage";
import SettingsPage from "./pages/church/SettingsPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// Members Sub-Pages
import MembersList from "./pages/church/members/MembersList";
import AddMember from "./pages/church/members/AddMember";
import CustomFieldsPage from "./pages/church/members/CustomFieldsPage";
import CategoriesPage from "./pages/church/members/CategoriesPage";
import PositionsPage from "./pages/church/members/PositionsPage";
import MemberCardPage from "./pages/church/members/MemberCardPage";
import BirthdaysPage from "./pages/church/members/BirthdaysPage";
import ReportsPage from "./pages/church/members/ReportsPage";
import MenuCustomizationPage from "./pages/church/members/MenuCustomizationPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-sky border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole === 'church_admin' && !['super_admin', 'admin_church'].includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// App Routes
const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* Super Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="super_admin">
                        <DashboardLayout variant="admin" />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuperAdminDashboard />} />
                <Route path="churches" element={<ChurchesManagement />} />
                <Route path="plans" element={<PlansManagement />} />
                <Route path="promotions" element={<PromotionsManagement />} />
            </Route>

            {/* Church Admin Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute requiredRole="church_admin">
                        <DashboardLayout variant="church" />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ChurchDashboard />} />
                
                {/* Members sub-routes */}
                <Route path="members" element={<MembersList />} />
                <Route path="members/add" element={<AddMember />} />
                <Route path="members/edit/:memberId" element={<AddMember />} />
                <Route path="members/custom-fields" element={<CustomFieldsPage />} />
                <Route path="members/categories" element={<CategoriesPage />} />
                <Route path="members/positions" element={<PositionsPage />} />
                <Route path="members/card" element={<MemberCardPage />} />
                <Route path="members/birthdays" element={<BirthdaysPage />} />
                <Route path="members/reports" element={<ReportsPage />} />
                <Route path="members/menu-edit" element={<MenuCustomizationPage />} />
                <Route path="members/:memberId" element={<MemberProfilePage />} />
                
                {/* Other routes */}
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="departments/:deptId" element={<DepartmentDetailPage />} />
                
                {/* Groups sub-routes */}
                <Route path="groups" element={<GroupsList />} />
                <Route path="groups/add" element={<AddGroup />} />
                <Route path="groups/edit/:groupId" element={<AddGroup />} />
                <Route path="groups/categories" element={<GroupCategories />} />
                <Route path="groups/reports" element={<GroupReports />} />
                <Route path="groups/export" element={<GroupExport />} />
                <Route path="groups/strategic" element={<GroupStrategicPanel />} />
                <Route path="groups/:groupId" element={<GroupDetailPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="financial" element={<FinancialPage />} />
                <Route path="discipleship" element={<DiscipleshipPage />} />
                <Route path="communication" element={<CommunicationPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <Toaster position="top-right" richColors />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
