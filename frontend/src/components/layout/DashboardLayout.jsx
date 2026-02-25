import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
    LayoutDashboard,
    Users,
    Church,
    Calendar,
    DollarSign,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    CreditCard,
    Tag,
    BarChart3,
    ChevronRight,
    BookOpen,
} from 'lucide-react';

const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/churches', label: 'Igrejas', icon: Building2 },
    { path: '/admin/plans', label: 'Planos', icon: CreditCard },
    { path: '/admin/promotions', label: 'Promoções', icon: Tag },
];

const churchNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/members', label: 'Membros', icon: Users },
    { path: '/dashboard/ministries', label: 'Ministérios', icon: Church },
    { path: '/dashboard/events', label: 'Eventos', icon: Calendar },
    { path: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
    { path: '/dashboard/discipleship', label: 'Discipulado', icon: BookOpen },
    { path: '/dashboard/communication', label: 'Comunicação', icon: MessageSquare },
    { path: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function DashboardLayout({ variant = 'church' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = variant === 'admin' ? adminNavItems : churchNavItems;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (item) => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-brand-surface">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-sky to-brand-blue flex items-center justify-center">
                            <Church className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading font-bold text-slate-900">Firmes</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                                    active
                                        ? "bg-brand-sky/10 text-brand-sky-active"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
                    {variant === 'admin' && user?.role === 'super_admin' && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mb-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Painel Igreja</span>
                        </Link>
                    )}
                    {variant === 'church' && user?.role === 'super_admin' && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mb-2"
                        >
                            <Building2 className="w-4 h-4" />
                            <span>Painel Admin</span>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
                            data-testid="mobile-menu-btn"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-heading font-semibold text-slate-900">
                            {variant === 'admin' ? 'Painel Administrativo' : 'Painel da Igreja'}
                        </h1>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-brand-sky/10 text-brand-sky-active text-sm font-medium">
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:block text-sm font-medium text-slate-700">
                                    {user?.name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/dashboard/settings" className="cursor-pointer">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Configurações
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer" data-testid="logout-btn">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
