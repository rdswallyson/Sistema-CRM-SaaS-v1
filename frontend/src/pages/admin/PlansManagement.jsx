import { useState, useEffect } from 'react';
import { adminAPI, publicAPI } from '../../lib/api';
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
import { Plus, CreditCard, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'essential',
        price_monthly: 97,
        price_yearly: 931.2,
        member_limit: 100,
        features: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await adminAPI.getPlans();
            setPlans(response.data);
        } catch (error) {
            // Try seeding plans if none exist
            try {
                await publicAPI.seedPlans();
                const response = await adminAPI.getPlans();
                setPlans(response.data);
            } catch (seedError) {
                console.error('Error fetching plans:', seedError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const planData = {
                ...formData,
                features: formData.features.split('\n').filter((f) => f.trim()),
            };
            await adminAPI.createPlan(planData);
            toast.success('Plano criado com sucesso!');
            setDialogOpen(false);
            setFormData({
                name: '',
                type: 'essential',
                price_monthly: 97,
                price_yearly: 931.2,
                member_limit: 100,
                features: '',
            });
            fetchPlans();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao criar plano';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Gestão de Planos</h1>
                    <p className="text-slate-500">Configure os planos de assinatura da plataforma</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-plan-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Criar Novo Plano</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Premium"
                                    required
                                    data-testid="plan-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger data-testid="plan-type-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="essential">Essencial</SelectItem>
                                        <SelectItem value="strategic">Estratégico</SelectItem>
                                        <SelectItem value="apostolic">Apostólico</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
                                    <Input
                                        id="price_monthly"
                                        type="number"
                                        value={formData.price_monthly}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                price_monthly: parseFloat(e.target.value),
                                                price_yearly: parseFloat(e.target.value) * 12 * 0.8,
                                            })
                                        }
                                        required
                                        data-testid="price-monthly-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price_yearly">Preço Anual (R$)</Label>
                                    <Input
                                        id="price_yearly"
                                        type="number"
                                        value={formData.price_yearly}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })
                                        }
                                        required
                                        data-testid="price-yearly-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_limit">Limite de Membros</Label>
                                <Input
                                    id="member_limit"
                                    type="number"
                                    value={formData.member_limit}
                                    onChange={(e) =>
                                        setFormData({ ...formData, member_limit: parseInt(e.target.value) })
                                    }
                                    required
                                    data-testid="member-limit-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="features">Recursos (um por linha)</Label>
                                <textarea
                                    id="features"
                                    value={formData.features}
                                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="Dashboard básico&#10;Gestão de membros&#10;Eventos"
                                    className="w-full h-24 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    data-testid="features-input"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="create-plan-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Plano'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Plans Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="plans-grid">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="dashboard-card card-hover" data-testid={`plan-${plan.type}`}>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className={
                                            plan.is_active
                                                ? 'bg-brand-sky/10 text-brand-sky-active'
                                                : 'bg-slate-100 text-slate-500'
                                        }
                                    >
                                        {plan.is_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                    <CreditCard className="w-5 h-5 text-slate-400" />
                                </div>
                                <CardTitle className="font-heading text-xl mt-4">{plan.name}</CardTitle>
                                <div className="mt-2">
                                    <span className="text-3xl font-bold text-slate-900">
                                        {formatCurrency(plan.price_monthly)}
                                    </span>
                                    <span className="text-slate-500">/mês</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    ou {formatCurrency(plan.price_yearly)}/ano
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 mb-4">
                                    Até {plan.member_limit?.toLocaleString('pt-BR')} membros
                                </p>
                                <ul className="space-y-2">
                                    {plan.features?.slice(0, 5).map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-brand-sky shrink-0 mt-0.5" />
                                            <span className="text-slate-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}

                    {plans.length === 0 && (
                        <Card className="dashboard-card col-span-full">
                            <CardContent className="py-8 text-center">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Nenhum plano cadastrado</p>
                                <Button
                                    onClick={() => publicAPI.seedPlans().then(fetchPlans)}
                                    className="mt-4"
                                    variant="outline"
                                    data-testid="seed-plans-btn"
                                >
                                    Criar Planos Padrão
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
