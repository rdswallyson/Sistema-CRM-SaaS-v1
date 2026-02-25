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
import MembersPage from "./pages/church/MembersPage";
import MemberProfilePage from "./pages/church/MemberProfilePage";
import MinistriesPage from "./pages/church/MinistriesPage";
import EventsPage from "./pages/church/EventsPage";
import FinancialPage from "./pages/church/FinancialPage";
import CommunicationPage from "./pages/church/CommunicationPage";
import DiscipleshipPage from "./pages/church/DiscipleshipPage";
import SettingsPage from "./pages/church/SettingsPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-surface">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
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
                <Route path="members" element={<MembersPage />} />
                <Route path="members/:memberId" element={<MemberProfilePage />} />
                <Route path="ministries" element={<MinistriesPage />} />
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
