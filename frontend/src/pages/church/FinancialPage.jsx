import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { formatCurrency, formatDateTime, donationTypeLabels, donationTypeColors } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Plus,
    DollarSign,
    TrendingUp,
    Wallet,
    Gift,
    Receipt,
    Loader2,
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
import { toast } from 'sonner';

const COLORS = ['#4ade80', '#3b82f6', '#a855f7', '#f59e0b'];

export default function FinancialPage() {
    const [donations, setDonations] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        member_name: '',
        amount: '',
        donation_type: 'tithe',
        payment_method: 'cash',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [donationsRes, summaryRes] = await Promise.all([
                churchAPI.getDonations(),
                churchAPI.getFinancialSummary(),
            ]);
            setDonations(donationsRes.data);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Error fetching financial data:', error);
            // Set mock data on error
            setSummary({
                total_tithes: 12500,
                total_offerings: 4800,
                total_special: 2200,
                total_recurring: 3500,
                grand_total: 23000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await churchAPI.createDonation({
                ...formData,
                amount: parseFloat(formData.amount),
            });
            toast.success('Doação registrada com sucesso!');
            setDialogOpen(false);
            setFormData({
                member_name: '',
                amount: '',
                donation_type: 'tithe',
                payment_method: 'cash',
                notes: '',
            });
            fetchData();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao registrar doação';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const pieData = summary
        ? [
              { name: 'Dízimos', value: summary.total_tithes, color: '#4ade80' },
              { name: 'Ofertas', value: summary.total_offerings, color: '#3b82f6' },
              { name: 'Especiais', value: summary.total_special, color: '#a855f7' },
              { name: 'Recorrentes', value: summary.total_recurring, color: '#f59e0b' },
          ].filter((d) => d.value > 0)
        : [];

    // Mock monthly data for chart
    const monthlyData = [
        { month: 'Jan', valor: 18500 },
        { month: 'Fev', valor: 19200 },
        { month: 'Mar', valor: 21100 },
        { month: 'Abr', valor: 20800 },
        { month: 'Mai', valor: 22500 },
        { month: 'Jun', valor: 23000 },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Financeiro</h1>
                    <p className="text-slate-500">Controle de dízimos, ofertas e doações</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-donation-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Entrada
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Registrar Doação</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="member_name">Nome do Membro (opcional)</Label>
                                <Input
                                    id="member_name"
                                    value={formData.member_name}
                                    onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                                    placeholder="João da Silva"
                                    data-testid="donation-member-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor (R$) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="100.00"
                                    required
                                    data-testid="donation-amount-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="donation_type">Tipo</Label>
                                    <Select
                                        value={formData.donation_type}
                                        onValueChange={(value) => setFormData({ ...formData, donation_type: value })}
                                    >
                                        <SelectTrigger data-testid="donation-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tithe">Dízimo</SelectItem>
                                            <SelectItem value="offering">Oferta</SelectItem>
                                            <SelectItem value="special">Especial</SelectItem>
                                            <SelectItem value="recurring">Recorrente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                                    >
                                        <SelectTrigger data-testid="payment-method-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Dinheiro</SelectItem>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="card">Cartão</SelectItem>
                                            <SelectItem value="transfer">Transferência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Observações..."
                                    data-testid="donation-notes-input"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="save-donation-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Registrar Doação'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="dashboard-card" data-testid="summary-tithes">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Dízimos</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(summary?.total_tithes || 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-brand-sky/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-brand-sky" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="summary-offerings">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Ofertas</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(summary?.total_offerings || 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-brand-blue" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="summary-special">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Especiais</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(summary?.total_special || 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="summary-total">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {formatCurrency(summary?.grand_total || 0)}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="dashboard-card lg:col-span-2" data-testid="financial-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Evolução Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(value), 'Total']}
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="valor"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValor)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="distribution-chart">
                    <CardHeader>
                        <CardTitle className="font-heading">Distribuição</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                            {pieData.map((item, index) => (
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
            </div>

            {/* Recent Donations */}
            <Card className="dashboard-card" data-testid="recent-donations">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Últimas Entradas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {donations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Data</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Membro</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Tipo</th>
                                        <th className="text-right py-3 px-4 font-medium text-slate-500 text-sm">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donations.slice(0, 10).map((donation, index) => (
                                        <tr key={donation.id || index} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {formatDateTime(donation.donation_date)}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                                {donation.member_name || 'Anônimo'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge className={donationTypeColors[donation.donation_type]}>
                                                    {donationTypeLabels[donation.donation_type]}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-slate-900">
                                                {formatCurrency(donation.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhuma doação registrada</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
