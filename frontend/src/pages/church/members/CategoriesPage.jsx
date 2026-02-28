import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await churchAPI.getMemberCategories();
            setCategories(res.data || []);
        } catch (e) { toast.error('Erro ao carregar categorias'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            if (editing) {
                await churchAPI.updateMemberCategory(editing.id, formData);
                toast.success('Categoria atualizada!');
            } else {
                await churchAPI.createMemberCategory(formData);
                toast.success('Categoria criada!');
            }
            setDialogOpen(false);
            resetForm();
            fetchCategories();
        } catch (e) { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (cat) => {
        setEditing(cat);
        setFormData({ name: cat.name, description: cat.description || '', color: cat.color || '#3b82f6' });
        setDialogOpen(true);
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`Excluir "${cat.name}"?`)) return;
        try {
            await churchAPI.deleteMemberCategory(cat.id);
            toast.success('Categoria excluída');
            fetchCategories();
        } catch (e) { toast.error('Erro ao excluir'); }
    };

    const resetForm = () => { setEditing(null); setFormData({ name: '', description: '', color: '#3b82f6' }); };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Categorias de Membros</h1>
                    <p className="text-slate-500">Organize seus membros em categorias</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-category-btn">
                            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Líder" required data-testid="category-name-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição da categoria" data-testid="category-desc-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Cor</Label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-10 h-10 rounded cursor-pointer" />
                                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-category-btn">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="dashboard-card" data-testid="categories-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <FolderTree className="w-5 h-5" /> Categorias ({categories.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
                    ) : categories.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900">{cat.name}</p>
                                        {cat.description && <p className="text-xs text-slate-500 truncate">{cat.description}</p>}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <FolderTree className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhuma categoria criada</p>
                            <p className="text-sm mt-1">Ex: Líder, Obreiro, Voluntário, Visitante</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
