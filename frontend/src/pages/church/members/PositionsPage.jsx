import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export default function PositionsPage() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', hierarchy_level: 0 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchPositions(); }, []);

    const fetchPositions = async () => {
        try {
            const res = await churchAPI.getMemberPositions();
            setPositions(res.data || []);
        } catch (e) { toast.error('Erro ao carregar cargos'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            const data = { ...formData, hierarchy_level: parseInt(formData.hierarchy_level) || 0 };
            if (editing) {
                await churchAPI.updateMemberPosition(editing.id, data);
                toast.success('Cargo atualizado!');
            } else {
                await churchAPI.createMemberPosition(data);
                toast.success('Cargo criado!');
            }
            setDialogOpen(false);
            resetForm();
            fetchPositions();
        } catch (e) { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (pos) => {
        setEditing(pos);
        setFormData({ name: pos.name, description: pos.description || '', hierarchy_level: pos.hierarchy_level || 0 });
        setDialogOpen(true);
    };

    const handleDelete = async (pos) => {
        if (!window.confirm(`Excluir "${pos.name}"?`)) return;
        try {
            await churchAPI.deleteMemberPosition(pos.id);
            toast.success('Cargo excluído');
            fetchPositions();
        } catch (e) { toast.error('Erro ao excluir'); }
    };

    const resetForm = () => { setEditing(null); setFormData({ name: '', description: '', hierarchy_level: 0 }); };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Cargos</h1>
                    <p className="text-slate-500">Defina os cargos e níveis hierárquicos</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-position-btn">
                            <Plus className="w-4 h-4 mr-2" /> Novo Cargo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Cargo *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Pastor" required data-testid="position-name-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do cargo" data-testid="position-desc-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Nível Hierárquico</Label>
                                <Input type="number" min="0" value={formData.hierarchy_level}
                                    onChange={(e) => setFormData({ ...formData, hierarchy_level: e.target.value })}
                                    data-testid="position-level-input" />
                                <p className="text-xs text-slate-500">0 = mais alto na hierarquia</p>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-position-btn">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="dashboard-card" data-testid="positions-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Briefcase className="w-5 h-5" /> Cargos ({positions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
                    ) : positions.length > 0 ? (
                        <div className="space-y-3">
                            {positions.map((pos, idx) => (
                                <div key={pos.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-brand-sky/10 flex items-center justify-center text-sm font-bold text-brand-sky">
                                        {pos.hierarchy_level}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900">{pos.name}</p>
                                        {pos.description && <p className="text-xs text-slate-500 truncate">{pos.description}</p>}
                                    </div>
                                    <Badge variant="outline">Nível {pos.hierarchy_level}</Badge>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(pos)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(pos)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum cargo criado</p>
                            <p className="text-sm mt-1">Ex: Pastor, Diácono, Obreiro</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
