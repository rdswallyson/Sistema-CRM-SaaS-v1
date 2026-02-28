import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { churchAPI } from '../../lib/api';
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
    ChevronDown,
    BookOpen,
    List,
    UserPlus,
    Layers,
    FolderTree,
    Briefcase,
    IdCard,
    Cake,
    FileText,
    Pencil,
} from 'lucide-react';

const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/churches', label: 'Igrejas', icon: Building2 },
    { path: '/admin/plans', label: 'Planos', icon: CreditCard },
    { path: '/admin/promotions', label: 'Promoções', icon: Tag },
];

const defaultMemberSubItems = [
    { path: '/dashboard/members', key: 'members_list', defaultLabel: 'Ver todos', icon: List, exact: true },
    { path: '/dashboard/members/add', key: 'members_add', defaultLabel: 'Adicionar membro', icon: UserPlus },
    { path: '/dashboard/members/custom-fields', key: 'members_custom_fields', defaultLabel: 'Campos adicionais', icon: Layers },
    { path: '/dashboard/members/categories', key: 'members_categories', defaultLabel: 'Categorias', icon: FolderTree },
    { path: '/dashboard/members/positions', key: 'members_positions', defaultLabel: 'Cargos', icon: Briefcase },
    { path: '/dashboard/members/card', key: 'members_card', defaultLabel: 'Cartão do membro', icon: IdCard },
    { path: '/dashboard/members/birthdays', key: 'members_birthdays', defaultLabel: 'Aniversariantes', icon: Cake },
    { path: '/dashboard/members/reports', key: 'members_reports', defaultLabel: 'Relatórios', icon: FileText },
    { path: '/dashboard/members/menu-edit', key: 'members_menu_edit', defaultLabel: 'Editar nomes do menu', icon: Pencil },
];

const defaultGroupSubItems = [
    { path: '/dashboard/groups', key: 'groups_list', defaultLabel: 'Ver todos', icon: List, exact: true },
    { path: '/dashboard/groups/add', key: 'groups_add', defaultLabel: 'Adicionar grupo', icon: UserPlus },
    { path: '/dashboard/groups/categories', key: 'groups_categories', defaultLabel: 'Categorias de grupos', icon: FolderTree },
    { path: '/dashboard/groups/reports', key: 'groups_reports', defaultLabel: 'Relatórios', icon: FileText },
    { path: '/dashboard/groups/export', key: 'groups_export', defaultLabel: 'Exportar', icon: FileText },
    { path: '/dashboard/groups/strategic', key: 'groups_strategic', defaultLabel: 'Painel Estratégico', icon: BarChart3 },
];

const churchNavBase = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/dashboard/departments', label: 'Departamentos', icon: Church },
    { path: '/dashboard/events', label: 'Eventos', icon: Calendar },
    { path: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
    { path: '/dashboard/discipleship', label: 'Discipulado', icon: BookOpen },
    { path: '/dashboard/communication', label: 'Comunicação', icon: MessageSquare },
    { path: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function DashboardLayout({ variant = 'church' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [membersExpanded, setMembersExpanded] = useState(false);
    const [menuLabels, setMenuLabels] = useState({});
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = variant === 'admin' ? adminNavItems : churchNavBase;

    useEffect(() => {
        if (variant === 'church') {
            fetchMenuLabels();
        }
    }, [variant]);

    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/members')) {
            setMembersExpanded(true);
        }
    }, [location.pathname]);

    const fetchMenuLabels = async () => {
        try {
            const res = await churchAPI.getMenuCustomization();
            const labels = {};
            (res.data || []).forEach(item => {
                labels[item.menu_key] = item.display_name;
            });
            setMenuLabels(labels);
        } catch (e) {
            // silently ignore - use defaults
        }
    };

    const getMenuLabel = (key, defaultLabel) => menuLabels[key] || defaultLabel;
    const membersMainLabel = getMenuLabel('members_main', 'Membros');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    const isMembersActive = location.pathname.startsWith('/dashboard/members');

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-brand-surface">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-sky to-brand-blue flex items-center justify-center">
                            <Church className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading font-bold text-slate-900">Firmes</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {variant === 'church' && (
                        <>
                            {/* Dashboard link */}
                            <Link
                                to="/dashboard"
                                data-testid="nav-dashboard"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                                    location.pathname === '/dashboard'
                                        ? "bg-brand-sky/10 text-brand-sky-active"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>

                            {/* Members expandable section */}
                            <div>
                                <button
                                    data-testid="nav-membros"
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors w-full text-left",
                                        isMembersActive
                                            ? "bg-brand-sky/10 text-brand-sky-active"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                    onClick={() => setMembersExpanded(!membersExpanded)}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="flex-1">{membersMainLabel}</span>
                                    {membersExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                                {membersExpanded && (
                                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                                        {defaultMemberSubItems.map((sub) => {
                                            const Icon = sub.icon;
                                            const active = sub.exact
                                                ? location.pathname === sub.path
                                                : location.pathname.startsWith(sub.path);
                                            return (
                                                <Link
                                                    key={sub.path}
                                                    to={sub.path}
                                                    data-testid={`nav-${sub.key}`}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors",
                                                        active
                                                            ? "bg-brand-sky/10 text-brand-sky-active font-medium"
                                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                                    )}
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{getMenuLabel(sub.key, sub.defaultLabel)}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Other nav items */}
                            {navItems.filter(i => i.path !== '/dashboard').map((item) => {
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
                        </>
                    )}

                    {variant === 'admin' && navItems.map((item) => {
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

                <div className="p-4 border-t border-slate-100 shrink-0">
                    {variant === 'admin' && user?.role === 'super_admin' && (
                        <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mb-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Painel Igreja</span>
                        </Link>
                    )}
                    {variant === 'church' && user?.role === 'super_admin' && (
                        <Link to="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mb-2">
                            <Building2 className="w-4 h-4" />
                            <span>Painel Admin</span>
                        </Link>
                    )}
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" data-testid="mobile-menu-btn">
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
                                <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
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

                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
