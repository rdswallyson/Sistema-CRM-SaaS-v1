import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { formatCurrency, planTypeLabels } from '../../lib/utils';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Plus,
    Search,
    MoreVertical,
    Building2,
    Edit,
    Trash2,
    Power,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChurchesManagement() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        admin_email: '',
        admin_name: '',
        admin_password: '',
        plan_type: 'essential',
        member_limit: 100,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await adminAPI.getTenants();
            setTenants(response.data);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            toast.error('Erro ao carregar igrejas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await adminAPI.createTenant(formData);
            toast.success('Igreja criada com sucesso!');
            setDialogOpen(false);
            setFormData({
                name: '',
                admin_email: '',
                admin_name: '',
                admin_password: '',
                plan_type: 'essential',
                member_limit: 100,
            });
            fetchTenants();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao criar igreja';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (tenant) => {
        try {
            await adminAPI.updateTenant(tenant.id, { is_active: !tenant.is_active });
            toast.success(`Igreja ${tenant.is_active ? 'desativada' : 'ativada'} com sucesso`);
            fetchTenants();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleDeleteTenant = async (tenant) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${tenant.name}"?`)) return;

        try {
            await adminAPI.deleteTenant(tenant.id);
            toast.success('Igreja excluída com sucesso');
            fetchTenants();
        } catch (error) {
            toast.error('Erro ao excluir igreja');
        }
    };

    const filteredTenants = tenants.filter(
        (t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const memberLimitByPlan = {
        essential: 100,
        strategic: 500,
        apostolic: 2000,
        enterprise: 999999,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Gestão de Igrejas</h1>
                    <p className="text-slate-500">Gerencie todas as igrejas da plataforma</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-church-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Igreja
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Criar Nova Igreja</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateTenant} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Igreja</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Igreja Vida Nova"
                                    required
                                    data-testid="church-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin_name">Nome do Administrador</Label>
                                <Input
                                    id="admin_name"
                                    value={formData.admin_name}
                                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                    placeholder="Pastor João"
                                    required
                                    data-testid="admin-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin_email">Email do Administrador</Label>
                                <Input
                                    id="admin_email"
                                    type="email"
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                    placeholder="pastor@igreja.com"
                                    required
                                    data-testid="admin-email-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="admin_password">Senha do Administrador</Label>
                                <Input
                                    id="admin_password"
                                    type="password"
                                    value={formData.admin_password}
                                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    data-testid="admin-password-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan_type">Plano</Label>
                                <Select
                                    value={formData.plan_type}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            plan_type: value,
                                            member_limit: memberLimitByPlan[value],
                                        })
                                    }
                                >
                                    <SelectTrigger data-testid="plan-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="essential">Essencial - R$97/mês</SelectItem>
                                        <SelectItem value="strategic">Estratégico - R$197/mês</SelectItem>
                                        <SelectItem value="apostolic">Apostólico - R$397/mês</SelectItem>
                                        <SelectItem value="enterprise">Enterprise - R$997/mês</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="create-church-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Igreja'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar igreja..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="search-input"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Churches List */}
            <Card className="dashboard-card" data-testid="churches-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Igrejas ({filteredTenants.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
                        </div>
                    ) : filteredTenants.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Igreja</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Plano</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Limite</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                                        <th className="text-right py-3 px-4 font-medium text-slate-500 text-sm">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTenants.map((tenant) => (
                                        <tr key={tenant.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: tenant.primary_color + '20' }}
                                                    >
                                                        <Building2
                                                            className="w-5 h-5"
                                                            style={{ color: tenant.primary_color }}
                                                        />
                                                    </div>
                                                    <span className="font-medium text-slate-900">{tenant.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">
                                                    {planTypeLabels[tenant.plan_type] || tenant.plan_type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                {tenant.member_limit?.toLocaleString('pt-BR')} membros
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    className={
                                                        tenant.is_active
                                                            ? 'bg-brand-sky/10 text-brand-sky-active'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }
                                                >
                                                    {tenant.is_active ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" data-testid={`church-menu-${tenant.id}`}>
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {tenant.is_active ? 'Desativar' : 'Ativar'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteTenant(tenant)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhuma igreja encontrada</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
