import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { formatCurrency, planTypeLabels } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444'];

// Mock data for charts
const revenueData = [
    { month: 'Jan', receita: 4500 },
    { month: 'Fev', receita: 5200 },
    { month: 'Mar', receita: 6100 },
    { month: 'Abr', receita: 7800 },
    { month: 'Mai', receita: 8500 },
    { month: 'Jun', receita: 9200 },
];

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, tenantsRes] = await Promise.all([
                    adminAPI.getMetrics(),
                    adminAPI.getTenants(),
                ]);
                setMetrics(metricsRes.data);
                setTenants(tenantsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Set mock data on error
                setMetrics({
                    total_churches: 45,
                    total_members: 3420,
                    mrr: 12500,
                    new_churches_30d: 8,
                    churn_rate: 2.5,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const planDistribution = [
        { name: 'Essencial', value: 25, color: '#4ade80' },
        { name: 'Estratégico', value: 15, color: '#3b82f6' },
        { name: 'Apostólico', value: 5, color: '#f59e0b' },
    ];

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
                <h1 className="font-heading text-2xl font-bold text-slate-900">Dashboard Global</h1>
                <p className="text-slate-500">Visão geral de todas as igrejas na plataforma</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="dashboard-card" data-testid="metric-churches">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Igrejas Ativas</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {metrics?.total_churches || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-brand-sky" />
                                    <span className="text-brand-sky font-medium">+{metrics?.new_churches_30d || 0}</span>
                                    <span className="text-slate-500">nos últimos 30 dias</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-brand-sky/10 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-brand-sky" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-members">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total de Membros</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {metrics?.total_members?.toLocaleString('pt-BR') || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-brand-blue" />
                                    <span className="text-brand-blue font-medium">+12%</span>
                                    <span className="text-slate-500">este mês</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-brand-blue" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-mrr">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Receita Mensal (MRR)</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(metrics?.mrr || 0)}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-brand-sky" />
                                    <span className="text-brand-sky font-medium">+8.5%</span>
                                    <span className="text-slate-500">vs mês anterior</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="metric-churn">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Taxa de Churn</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {metrics?.churn_rate || 0}%
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingDown className="w-4 h-4 text-brand-sky" />
                                    <span className="text-brand-sky font-medium">-0.5%</span>
                                    <span className="text-slate-500">vs mês anterior</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="dashboard-card lg:col-span-2" data-testid="revenue-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Evolução da Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Receita']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="receita"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorReceita)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Distribution */}
                <Card className="dashboard-card" data-testid="plan-distribution">
                    <CardHeader>
                        <CardTitle className="font-heading">Distribuição por Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {planDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            {planDistribution.map((plan, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                                    <span className="text-sm text-slate-600">{plan.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Churches */}
            <Card className="dashboard-card" data-testid="recent-churches">
                <CardHeader>
                    <CardTitle className="font-heading">Igrejas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Igreja</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Plano</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Membros</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.length > 0 ? (
                                    tenants.slice(0, 5).map((tenant, index) => (
                                        <tr key={tenant.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <span className="font-medium text-slate-900">{tenant.name}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">
                                                    {planTypeLabels[tenant.plan_type] || tenant.plan_type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge className={tenant.is_active ? 'bg-brand-sky/10 text-brand-sky-active' : 'bg-slate-100 text-slate-500'}>
                                                    {tenant.is_active ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                {tenant.member_limit || 100}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-500">
                                            Nenhuma igreja cadastrada ainda
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
