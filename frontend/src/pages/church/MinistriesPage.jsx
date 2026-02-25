import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Plus,
    MoreVertical,
    Church,
    Edit,
    Trash2,
    Users,
    Target,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MinistriesPage() {
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMinistry, setEditingMinistry] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        goals: '',
        meeting_schedule: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMinistries();
    }, []);

    const fetchMinistries = async () => {
        try {
            const response = await churchAPI.getMinistries();
            setMinistries(response.data);
        } catch (error) {
            console.error('Error fetching ministries:', error);
            toast.error('Erro ao carregar ministérios');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingMinistry) {
                await churchAPI.updateMinistry(editingMinistry.id, formData);
                toast.success('Ministério atualizado com sucesso!');
            } else {
                await churchAPI.createMinistry(formData);
                toast.success('Ministério criado com sucesso!');
            }
            setDialogOpen(false);
            resetForm();
            fetchMinistries();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao salvar ministério';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (ministry) => {
        setEditingMinistry(ministry);
        setFormData({
            name: ministry.name || '',
            description: ministry.description || '',
            goals: ministry.goals || '',
            meeting_schedule: ministry.meeting_schedule || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (ministry) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${ministry.name}"?`)) return;

        try {
            await churchAPI.deleteMinistry(ministry.id);
            toast.success('Ministério excluído com sucesso');
            fetchMinistries();
        } catch (error) {
            toast.error('Erro ao excluir ministério');
        }
    };

    const resetForm = () => {
        setEditingMinistry(null);
        setFormData({
            name: '',
            description: '',
            goals: '',
            meeting_schedule: '',
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Ministérios</h1>
                    <p className="text-slate-500">Gerencie os ministérios da sua igreja</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-ministry-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Ministério
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">
                                {editingMinistry ? 'Editar Ministério' : 'Criar Ministério'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Ministério *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Louvor"
                                    required
                                    data-testid="ministry-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do ministério..."
                                    className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    data-testid="ministry-description-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="goals">Metas</Label>
                                <Input
                                    id="goals"
                                    value={formData.goals}
                                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                    placeholder="Ex: Alcançar 50 membros"
                                    data-testid="ministry-goals-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meeting_schedule">Agenda de Reuniões</Label>
                                <Input
                                    id="meeting_schedule"
                                    value={formData.meeting_schedule}
                                    onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                                    placeholder="Ex: Sábados às 15h"
                                    data-testid="ministry-schedule-input"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="save-ministry-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    editingMinistry ? 'Salvar Alterações' : 'Criar Ministério'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Ministries Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="ministries-grid">
                    {ministries.map((ministry) => (
                        <Card key={ministry.id} className="dashboard-card card-hover" data-testid={`ministry-${ministry.id}`}>
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-sky/10 to-brand-blue/10 flex items-center justify-center">
                                        <Church className="w-6 h-6 text-brand-blue" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" data-testid={`ministry-menu-${ministry.id}`}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(ministry)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(ministry)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="font-heading text-xl mt-4">{ministry.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ministry.description && (
                                    <p className="text-sm text-slate-600 mb-4">{ministry.description}</p>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">
                                            {ministry.member_count || 0} membros
                                        </span>
                                    </div>
                                    {ministry.goals && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Target className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-600">{ministry.goals}</span>
                                        </div>
                                    )}
                                    {ministry.meeting_schedule && (
                                        <Badge variant="outline" className="mt-2">
                                            {ministry.meeting_schedule}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {ministries.length === 0 && (
                        <Card className="dashboard-card col-span-full">
                            <CardContent className="py-8 text-center">
                                <Church className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Nenhum ministério cadastrado</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
