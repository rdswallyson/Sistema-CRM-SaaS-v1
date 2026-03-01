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
import { Plus, Loader2, MoreVertical, Edit, Trash2, Contact } from 'lucide-react';
import { toast } from 'sonner';

export default function FinContatos() {
    const [contatos, setContatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ nome: '', tipo: 'contribuinte', email: '', telefone: '', documento: '', notas: '' });

    const fetchData = async () => {
        try { const r = await churchAPI.getFinContatos(); setContatos(r.data || []); }
        catch { toast.error('Erro'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateFinContato(editing.id, form); toast.success('Atualizado!'); }
            else { await churchAPI.createFinContato(form); toast.success('Criado!'); }
            setDialogOpen(false); resetForm(); fetchData();
        } catch { toast.error('Erro'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (c) => { setEditing(c); setForm({ nome: c.nome, tipo: c.tipo, email: c.email || '', telefone: c.telefone || '', documento: c.documento || '', notas: c.notas || '' }); setDialogOpen(true); };
    const handleDelete = async (c) => { if (!window.confirm(`Excluir "${c.nome}"?`)) return; try { await churchAPI.deleteFinContato(c.id); toast.success('Removido'); fetchData(); } catch { toast.error('Erro'); } };
    const resetForm = () => { setEditing(null); setForm({ nome: '', tipo: 'contribuinte', email: '', telefone: '', documento: '', notas: '' }); };
    const tipoLabel = { fornecedor: 'Fornecedor', contribuinte: 'Contribuinte', parceiro: 'Parceiro' };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-contatos-title">Contatos Financeiros</h1>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-fin-contato-btn"><Plus className="w-4 h-4 mr-2" /> Novo Contato</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Contato</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required data-testid="fin-contato-nome" /></div>
                            <div className="space-y-2"><Label>Tipo</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fornecedor">Fornecedor</SelectItem><SelectItem value="contribuinte">Contribuinte</SelectItem><SelectItem value="parceiro">Parceiro</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} /></div>
                            </div>
                            <div className="space-y-2"><Label>Documento (CPF/CNPJ)</Label><Input value={form.documento} onChange={(e) => setForm({...form, documento: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Notas</Label><textarea value={form.notas} onChange={(e) => setForm({...form, notas: e.target.value})} className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" /></div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-fin-contato-btn">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="fin-contatos-grid">
                {contatos.map(c => (
                    <Card key={c.id} className="dashboard-card card-hover">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">{c.nome}</p>
                                    <Badge variant="outline" className="text-xs mt-1">{tipoLabel[c.tipo] || c.tipo}</Badge>
                                    {c.email && <p className="text-xs text-slate-500 mt-1">{c.email}</p>}
                                    {c.telefone && <p className="text-xs text-slate-500">{c.telefone}</p>}
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
                {contatos.length === 0 && <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center"><Contact className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhum contato</p></CardContent></Card>}
            </div>
        </div>
    );
}
