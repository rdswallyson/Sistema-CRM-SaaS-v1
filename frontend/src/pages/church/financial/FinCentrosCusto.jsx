import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Plus, Loader2, MoreVertical, Edit, Trash2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export default function FinCentrosCusto() {
    const [centros, setCentros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ nome: '', tipo: 'departamento', status: 'active' });

    const fetchData = async () => {
        try { const r = await churchAPI.getFinCentrosCusto(); setCentros(r.data || []); }
        catch { toast.error('Erro'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateFinCentro(editing.id, form); toast.success('Atualizado!'); }
            else { await churchAPI.createFinCentro(form); toast.success('Criado!'); }
            setDialogOpen(false); resetForm(); fetchData();
        } catch { toast.error('Erro'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (c) => { setEditing(c); setForm({ nome: c.nome, tipo: c.tipo, status: c.status }); setDialogOpen(true); };
    const handleDelete = async (c) => { if (!window.confirm(`Excluir "${c.nome}"?`)) return; try { await churchAPI.deleteFinCentro(c.id); toast.success('Removido'); fetchData(); } catch { toast.error('Erro'); } };
    const resetForm = () => { setEditing(null); setForm({ nome: '', tipo: 'departamento', status: 'active' }); };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-centros-title">Centros de Custos</h1>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-fin-centro-btn"><Plus className="w-4 h-4 mr-2" /> Novo Centro</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Centro de Custo</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required data-testid="fin-centro-nome" /></div>
                            <div className="space-y-2"><Label>Tipo</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="departamento">Departamento</SelectItem><SelectItem value="projeto">Projeto</SelectItem><SelectItem value="evento">Evento</SelectItem></SelectContent></Select>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-fin-centro-btn">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="fin-centros-grid">
                {centros.map(c => (
                    <Card key={c.id} className="dashboard-card card-hover">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <FolderTree className="w-5 h-5 text-brand-sky" />
                                    <div>
                                        <p className="font-medium text-slate-900">{c.nome}</p>
                                        <Badge variant="outline" className="text-xs capitalize">{c.tipo}</Badge>
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
                {centros.length === 0 && <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center"><FolderTree className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhum centro de custo</p></CardContent></Card>}
            </div>
        </div>
    );
}
