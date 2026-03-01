import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Plus, Loader2, MoreVertical, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function FinCategorias() {
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ nome: '', tipo: 'receita', cor: '#6366f1', status: 'active' });

    const fetchData = async () => {
        try { const r = await churchAPI.getFinCategorias(); setCats(r.data || []); }
        catch { toast.error('Erro'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateFinCategoria(editing.id, form); toast.success('Atualizada!'); }
            else { await churchAPI.createFinCategoria(form); toast.success('Criada!'); }
            setDialogOpen(false); resetForm(); fetchData();
        } catch { toast.error('Erro'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (c) => { setEditing(c); setForm({ nome: c.nome, tipo: c.tipo, cor: c.cor || '#6366f1', status: c.status }); setDialogOpen(true); };
    const handleDelete = async (c) => { if (!window.confirm(`Excluir "${c.nome}"?`)) return; try { await churchAPI.deleteFinCategoria(c.id); toast.success('Removida'); fetchData(); } catch { toast.error('Erro'); } };
    const resetForm = () => { setEditing(null); setForm({ nome: '', tipo: 'receita', cor: '#6366f1', status: 'active' }); };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-categorias-title">Categorias Financeiras</h1>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-fin-cat-btn"><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required data-testid="fin-cat-nome" /></div>
                            <div className="space-y-2"><Label>Tipo</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}><SelectTrigger data-testid="fin-cat-tipo"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent></Select>
                            </div>
                            <div className="space-y-2"><Label>Cor</Label><div className="flex gap-2"><Input type="color" value={form.cor} onChange={(e) => setForm({...form, cor: e.target.value})} className="w-16 h-10 p-1" /><Input value={form.cor} onChange={(e) => setForm({...form, cor: e.target.value})} className="flex-1" /></div></div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-fin-cat-btn">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="fin-cats-grid">
                {cats.map(c => (
                    <Card key={c.id} className="dashboard-card card-hover">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.cor }} />
                                    <div>
                                        <p className="font-medium text-slate-900">{c.nome}</p>
                                        <Badge className={c.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{c.tipo}</Badge>
                                    </div>
                                </div>
                                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(c)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(c)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {cats.length === 0 && <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center"><Tag className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhuma categoria</p></CardContent></Card>}
            </div>
        </div>
    );
}
