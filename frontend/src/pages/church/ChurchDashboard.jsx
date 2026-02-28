import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { churchAPI } from '../../lib/api';
import { formatCurrency, formatDate, memberStatusLabels, memberStatusColors } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Users,
    Calendar,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Church,
    Cake,
    PartyPopper,
    ChevronRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#a855f7'];

// Mock data for charts
const growthData = [
    { month: 'Jan', membros: 120 },
    { month: 'Fev', membros: 135 },
    { month: 'Mar', membros: 148 },
    { month: 'Abr', membros: 162 },
    { month: 'Mai', membros: 175 },
    { month: 'Jun', membros: 190 },
];

const financialData = [
    { month: 'Jan', dizimos: 8500, ofertas: 3200 },
    { month: 'Fev', dizimos: 9200, ofertas: 2800 },
    { month: 'Mar', dizimos: 10100, ofertas: 4100 },
    { month: 'Abr', dizimos: 9800, ofertas: 3500 },
    { month: 'Mai', dizimos: 11500, ofertas: 4200 },
    { month: 'Jun', dizimos: 12200, ofertas: 4800 },
];

export default function ChurchDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [todayBirthdays, setTodayBirthdays] = useState([]);
    const [monthBirthdays, setMonthBirthdays] = useState([]);
    const [greetingSentIds, setGreetingSentIds] = useState([]);
    const [sendingGreetings, setSendingGreetings] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await churchAPI.getDashboard();
                setDashboard(response.data);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
                setDashboard({
                    total_members: 190,
                    total_visitors: 25,
                    total_ministries: 8,
                    monthly_revenue: 17000,
                    upcoming_events: [],
                    members_by_status: {
                        visitor: 25,
                        new_convert: 18,
                        member: 130,
                        leader: 17,
                    },
                    growth_percentage: 12.5,
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchBirthdays = async () => {
            try {
                const currentMonth = new Date().getMonth() + 1;
                const [birthdayRes, statusRes] = await Promise.all([
                    churchAPI.getMemberBirthdays(currentMonth),
                    churchAPI.getBirthdayGreetingStatus(),
                ]);
                const all = birthdayRes.data || [];
                setMonthBirthdays(all);
                setTodayBirthdays(all.filter(m => m.is_today));
                setGreetingSentIds(statusRes.data?.sent_member_ids || []);
            } catch (e) {
                // silently ignore
            }
        };

        fetchDashboard();
        fetchBirthdays();
    }, []);

    const handleSendGreetings = async () => {
        setSendingGreetings(true);
        try {
            const res = await churchAPI.sendBirthdayGreetings();
            const msg = res.data?.message || 'Parabéns enviado!';
            if (res.data?.sent_count > 0) {
                toast.success(msg);
                // Refresh status
                const statusRes = await churchAPI.getBirthdayGreetingStatus();
                setGreetingSentIds(statusRes.data?.sent_member_ids || []);
            } else {
                toast.info(msg);
            }
        } catch (e) {
            toast.error('Erro ao enviar parabéns');
        } finally {
            setSendingGreetings(false);
        }
    };

    const allGreetingsSent = todayBirthdays.length > 0 && todayBirthdays.every(m => greetingSentIds.includes(m.id));
    const pendingGreetings = todayBirthdays.filter(m => !greetingSentIds.includes(m.id));

    const statusDistribution = dashboard?.members_by_status
        ? Object.entries(dashboard.members_by_status).map(([key, value], index) => ({
              name: memberStatusLabels[key] || key,
              value,
              color: COLORS[index % COLORS.length],
          }))
        : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-sky border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Visão geral da sua igreja</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="dashboard-card" data-testid="metric-total-members">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total de Membros</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {dashboard?.total_members || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-brand-sky" />
                                    <span className="text-brand-sky font-medium">
                                        +{dashboard?.growth_percentage || 0}%
                                    </span>
                                    <span className="text-slate-500">este mês</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-brand-sky/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-brand-sky" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-visitors">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Visitantes</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {dashboard?.total_visitors || 0}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Aguardando acompanhamento
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-brand-blue" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-ministries">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Ministérios</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {dashboard?.total_ministries || 0}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">Ativos na igreja</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Church className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-revenue">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Receita do Mês</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(dashboard?.monthly_revenue || 0)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-brand-sky" />
                                    <span className="text-brand-sky font-medium">+8%</span>
                                    <span className="text-slate-500">vs mês anterior</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Birthday Notification Banner */}
            {todayBirthdays.length > 0 && (
                <Card className="dashboard-card border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" data-testid="birthday-alert">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <PartyPopper className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-heading font-semibold text-amber-900">
                                    {todayBirthdays.length === 1
                                        ? `${todayBirthdays[0].name} faz aniversário hoje!`
                                        : `${todayBirthdays.length} membros fazem aniversário hoje!`
                                    }
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {todayBirthdays.map(m => (
                                        <div key={m.id} className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden">
                                                {m.photo_url ? (
                                                    <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Cake className="w-3 h-3 text-amber-600" />
                                                )}
                                            </div>
                                            <span className="text-sm text-amber-800">{m.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Link to="/dashboard/members/birthdays">
                                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" data-testid="view-birthdays-btn">
                                    Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Month Birthdays Summary (when no today birthdays) */}
            {todayBirthdays.length === 0 && monthBirthdays.length > 0 && (
                <Card className="dashboard-card" data-testid="birthday-month-summary">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Cake className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-600">
                                    <span className="font-medium text-slate-900">{monthBirthdays.length} aniversariantes</span> este mês
                                    {monthBirthdays.length > 0 && (
                                        <span> — Próximo: <strong>{monthBirthdays[0].name}</strong> (dia {monthBirthdays[0].birth_day})</span>
                                    )}
                                </p>
                            </div>
                            <Link to="/dashboard/members/birthdays">
                                <Button variant="ghost" size="sm" className="text-slate-500" data-testid="view-month-birthdays-btn">
                                    Ver <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <Card className="dashboard-card" data-testid="growth-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Crescimento de Membros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorMembros" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="membros"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorMembros)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Chart */}
                <Card className="dashboard-card" data-testid="financial-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Receitas por Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="dizimos" fill="#4ade80" name="Dízimos" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="ofertas" fill="#3b82f6" name="Ofertas" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Members by Status */}
                <Card className="dashboard-card" data-testid="status-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Membros por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {statusDistribution.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm text-slate-600">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="dashboard-card" data-testid="upcoming-events">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Próximos Eventos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboard?.upcoming_events?.length > 0 ? (
                            <div className="space-y-3">
                                {dashboard.upcoming_events.slice(0, 4).map((event, index) => (
                                    <div
                                        key={event.id || index}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                                            <Calendar className="w-5 h-5 text-brand-blue" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate">
                                                {event.title}
                                            </p>
                                            <p className="text-sm text-slate-500">{event.event_date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                <p>Nenhum evento próximo</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className="dashboard-card" data-testid="alerts">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Alertas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">
                                            {dashboard?.total_visitors || 0} visitantes
                                        </p>
                                        <p className="text-xs text-amber-600">
                                            Aguardando acompanhamento
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">
                                            Membros ausentes
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            5 membros há +60 dias sem frequência
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
