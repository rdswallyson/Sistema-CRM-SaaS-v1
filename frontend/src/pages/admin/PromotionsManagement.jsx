import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
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
import { Plus, Tag, Percent, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PromotionsManagement() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        valid_until: '',
        applicable_plans: [],
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await adminAPI.getPromotions();
            setPromotions(response.data);
        } catch (error) {
            console.error('Error fetching promotions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromotion = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await adminAPI.createPromotion(formData);
            toast.success('Promoção criada com sucesso!');
            setDialogOpen(false);
            setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: 10,
                valid_until: '',
                applicable_plans: [],
            });
            fetchPromotions();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao criar promoção';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const isExpired = (date) => {
        return new Date(date) < new Date();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Promoções</h1>
                    <p className="text-slate-500">Gerencie cupons de desconto</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-promotion-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Promoção
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Criar Promoção</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePromotion} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código do Cupom</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                                    }
                                    placeholder="PROMO2024"
                                    required
                                    data-testid="promo-code-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount_type">Tipo de Desconto</Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, discount_type: value })
                                        }
                                    >
                                        <SelectTrigger data-testid="discount-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentual</SelectItem>
                                            <SelectItem value="fixed">Valor Fixo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount_value">
                                        Valor {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                                    </Label>
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                discount_value: parseFloat(e.target.value),
                                            })
                                        }
                                        required
                                        data-testid="discount-value-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valid_until">Válido até</Label>
                                <Input
                                    id="valid_until"
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={(e) =>
                                        setFormData({ ...formData, valid_until: e.target.value })
                                    }
                                    required
                                    data-testid="valid-until-input"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="create-promotion-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Promoção'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Promotions Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="promotions-grid">
                    {promotions.map((promo) => (
                        <Card
                            key={promo.id}
                            className={`dashboard-card card-hover ${
                                isExpired(promo.valid_until) ? 'opacity-60' : ''
                            }`}
                            data-testid={`promo-${promo.code}`}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className={
                                            promo.is_active && !isExpired(promo.valid_until)
                                                ? 'bg-brand-green/10 text-brand-green-active'
                                                : 'bg-slate-100 text-slate-500'
                                        }
                                    >
                                        {isExpired(promo.valid_until)
                                            ? 'Expirado'
                                            : promo.is_active
                                            ? 'Ativo'
                                            : 'Inativo'}
                                    </Badge>
                                    <Tag className="w-5 h-5 text-slate-400" />
                                </div>
                                <CardTitle className="font-heading text-2xl mt-4 font-mono">
                                    {promo.code}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                        {promo.discount_type === 'percentage' ? (
                                            <Percent className="w-6 h-6 text-brand-blue" />
                                        ) : (
                                            <span className="text-brand-blue font-bold">R$</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {promo.discount_type === 'percentage'
                                                ? `${promo.discount_value}%`
                                                : formatCurrency(promo.discount_value)}
                                        </p>
                                        <p className="text-sm text-slate-500">de desconto</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Válido até:</span>
                                        <span className="font-medium">{formatDate(promo.valid_until)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Usos:</span>
                                        <span className="font-medium">{promo.usage_count || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {promotions.length === 0 && (
                        <Card className="dashboard-card col-span-full">
                            <CardContent className="py-8 text-center">
                                <Tag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Nenhuma promoção cadastrada</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
