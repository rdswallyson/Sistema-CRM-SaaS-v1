import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
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
    Package,
    MapPin,
    ArrowLeftRight,
    Wrench,
    BarChart3,
    Loader2,
    Search,
    History
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PatrimonyPage() {
    const [items, setItems] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('list');
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        codigo_interno: '',
        categoria_id: '',
        local_id: '',
        valor_aquisicao: '',
        status: 'ativo'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, dashRes, catRes, locRes] = await Promise.all([
                churchAPI.getPatrimony({ search }),
                churchAPI.getPatrimonyDashboard(),
                churchAPI.getPatrimonyCategories(),
                churchAPI.getPatrimonyLocations()
            ]);
            setItems(itemsRes.data);
            setDashboard(dashRes.data);
            setCategories(catRes.data);
            setLocations(locRes.data);
        } catch (error) {
            console.error('Error fetching patrimony data:', error);
            toast.error('Erro ao carregar dados do patrimônio');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await churchAPI.createPatrimony({
                ...formData,
                valor_aquisicao: formData.valor_aquisicao ? parseFloat(formData.valor_aquisicao) : 0
            });
            toast.success('Bem cadastrado com sucesso!');
            setDialogOpen(false);
            setFormData({ nome: '', codigo_interno: '', categoria_id: '', local_id: '', valor_aquisicao: '', status: 'ativo' });
            fetchData();
        } catch (error) {
            toast.error('Erro ao cadastrar bem');
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors = {
        ativo: 'bg-green-100 text-green-800',
        em_manutencao: 'bg-yellow-100 text-yellow-800',
        baixado: 'bg-red-100 text-red-800'
    };

    if (loading && !items.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Patrimônio</h1>
                    <p className="text-slate-500">Gestão de bens e ativos da organização</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Bem
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Novo Bem</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome do Bem *</Label>
                                    <Input 
                                        id="nome" 
                                        value={formData.nome} 
                                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="codigo">Código Interno</Label>
                                        <Input 
                                            id="codigo" 
                                            value={formData.codigo_interno} 
                                            onChange={(e) => setFormData({...formData, codigo_interno: e.target.value})}
                                            placeholder="Auto-gerado se vazio"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="valor">Valor de Aquisição</Label>
                                        <Input 
                                            id="valor" 
                                            type="number" 
                                            value={formData.valor_aquisicao} 
                                            onChange={(e) => setFormData({...formData, valor_aquisicao: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Select onValueChange={(v) => setFormData({...formData, categoria_id: v})}>
                                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Local</Label>
                                        <Select onValueChange={(v) => setFormData({...formData, local_id: v})}>
                                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                            <SelectContent>
                                                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? 'Salvando...' : 'Salvar Bem'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total de Bens</p>
                                        <h3 className="text-2xl font-bold">{dashboard?.summary?.total_items || 0}</h3>
                                    </div>
                                    <Package className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Valor Estimado</p>
                                        <h3 className="text-2xl font-bold">{formatCurrency(dashboard?.summary?.total_value || 0)}</h3>
                                    </div>
                                    <BarChart3 className="w-8 h-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Custo Manutenção</p>
                                        <h3 className="text-2xl font-bold">{formatCurrency(dashboard?.total_maintenance_cost || 0)}</h3>
                                    </div>
                                    <Wrench className="w-8 h-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Bens por Categoria</CardTitle></CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dashboard?.by_category?.map(c => ({ name: c._id || 'Sem Categoria', value: c.count })) || []}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dashboard?.by_category?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Status dos Bens</CardTitle></CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard?.by_status?.map(s => ({ name: s._id, total: s.count })) || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="Buscar por nome ou código..." 
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                />
                            </div>
                            <Button variant="outline" onClick={fetchData}>Filtrar</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3">Bem</th>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Local</th>
                                        <th className="px-4 py-3">Valor</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium">{item.nome}</td>
                                            <td className="px-4 py-3 text-slate-500">{item.codigo_interno}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                                                    {locations.find(l => l.id === item.local_id)?.nome || 'Não definido'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{formatCurrency(item.valor_aquisicao || 0)}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={statusColors[item.status]}>
                                                    {item.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button variant="ghost" size="icon" title="Movimentar">
                                                    <ArrowLeftRight className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Manutenção">
                                                    <Wrench className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                                Nenhum bem encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
