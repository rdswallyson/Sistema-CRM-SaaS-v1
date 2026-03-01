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
import { Plus, Loader2, MoreVertical, Edit, Trash2, Wallet, Archive } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinContas() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ nome: '', tipo: 'banco', saldo_inicial: 0, status: 'active' });

    const fetchData = async () => {
        try { const r = await churchAPI.getFinContas(); setContas(r.data || []); }
        catch { toast.error('Erro'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateFinConta(editing.id, { nome: form.nome, tipo: form.tipo, status: form.status }); toast.success('Atualizada!'); }
            else { await churchAPI.createFinConta({ ...form, saldo_inicial: parseFloat(form.saldo_inicial) || 0 }); toast.success('Criada!'); }
            setDialogOpen(false); resetForm(); fetchData();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (c) => { setEditing(c); setForm({ nome: c.nome, tipo: c.tipo, saldo_inicial: c.saldo_inicial || 0, status: c.status }); setDialogOpen(true); };
    const handleDelete = async (c) => { if (!window.confirm(`Excluir "${c.nome}"?`)) return; try { await churchAPI.deleteFinConta(c.id); toast.success('Removida'); fetchData(); } catch (err) { toast.error(err.response?.data?.detail || 'Erro'); } };
    const resetForm = () => { setEditing(null); setForm({ nome: '', tipo: 'banco', saldo_inicial: 0, status: 'active' }); };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-contas-title">Contas Financeiras</h1>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-fin-conta-btn"><Plus className="w-4 h-4 mr-2" /> Nova Conta</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Conta</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} required data-testid="fin-conta-nome" /></div>
                            <div className="space-y-2"><Label>Tipo</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="caixa">Caixa</SelectItem><SelectItem value="banco">Banco</SelectItem><SelectItem value="carteira_digital">Carteira Digital</SelectItem></SelectContent></Select>
                            </div>
                            {!editing && <div className="space-y-2"><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={form.saldo_inicial} onChange={(e) => setForm({...form, saldo_inicial: e.target.value})} /></div>}
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-fin-conta-btn">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="fin-contas-grid">
                {contas.map(c => (
                    <Card key={c.id} className="dashboard-card card-hover">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="w-5 h-5 text-brand-sky" />
                                        <p className="font-heading font-medium text-slate-900">{c.nome}</p>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-xs mb-2">{c.tipo?.replace('_', ' ')}</Badge>
                                    <p className={`text-xl font-bold ${c.saldo_atual >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(c.saldo_atual)}</p>
                                    <p className="text-xs text-slate-400 mt-1">Saldo inicial: {fmt(c.saldo_inicial)}</p>
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
                {contas.length === 0 && <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center"><Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p className="text-slate-400">Nenhuma conta criada</p></CardContent></Card>}
            </div>
        </div>
    );
}
