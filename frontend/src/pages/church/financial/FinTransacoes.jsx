import { useState, useEffect, useCallback } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Plus, Search, Loader2, ArrowUpRight, ArrowDownRight, ArrowLeftRight, MoreVertical, Eye, XCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const tipoIcons = { receita: ArrowUpRight, despesa: ArrowDownRight, transferencia: ArrowLeftRight };
const tipoColors = { receita: 'text-green-600', despesa: 'text-red-600', transferencia: 'text-blue-600' };
const statusColors = { pendente: 'bg-amber-100 text-amber-700', confirmado: 'bg-green-100 text-green-700', cancelado: 'bg-red-100 text-red-700' };

export default function FinTransacoes() {
    const [txs, setTxs] = useState([]);
    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [centros, setCentros] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tipoFilter, setTipoFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [form, setForm] = useState({ tipo: 'receita', valor: '', data: new Date().toISOString().split('T')[0], conta_id: '', conta_destino_id: '', categoria_id: '', centro_custo_id: '', membro_id: '', descricao: '', status: 'confirmado' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (tipoFilter !== 'all') params.tipo = tipoFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;
            const [tRes, cRes, catRes, ccRes, mRes] = await Promise.all([
                churchAPI.getFinTransacoes(params),
                churchAPI.getFinContas(),
                churchAPI.getFinCategorias(),
                churchAPI.getFinCentrosCusto(),
                churchAPI.getMembers({ per_page: 2000 }),
            ]);
            setTxs(tRes.data || []);
            setContas(cRes.data || []);
            setCategorias(catRes.data || []);
            setCentros(ccRes.data || []);
            setMembers(mRes.data?.items || []);
        } catch { toast.error('Erro ao carregar'); }
        finally { setLoading(false); }
    }, [tipoFilter, statusFilter, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.valor || parseFloat(form.valor) <= 0) { toast.error('Valor invalido'); return; }
        setSubmitting(true);
        try {
            await churchAPI.createFinTransacao({ ...form, valor: parseFloat(form.valor) });
            toast.success('Transacao criada!');
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao criar'); }
        finally { setSubmitting(false); }
    };

    const handleCancel = async (tx) => {
        if (!window.confirm('Cancelar (estornar) esta transacao?')) return;
        try { await churchAPI.updateFinTransacao(tx.id, { status: 'cancelado' }); toast.success('Transacao cancelada'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
    };

    const handleDelete = async (tx) => {
        if (!window.confirm('Excluir esta transacao?')) return;
        try { await churchAPI.deleteFinTransacao(tx.id); toast.success('Removida'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
    };

    const resetForm = () => setForm({ tipo: 'receita', valor: '', data: new Date().toISOString().split('T')[0], conta_id: '', conta_destino_id: '', categoria_id: '', centro_custo_id: '', membro_id: '', descricao: '', status: 'confirmado' });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-transacoes-title">Transacoes</h1>
                    <p className="text-slate-500">{txs.length} transacao(oes)</p>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="add-transacao-btn">
                    <Plus className="w-4 h-4 mr-2" /> Nova Transacao
                </Button>
            </div>

            <Card className="dashboard-card"><CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-transacoes" />
                    </div>
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="receita">Receita</SelectItem>
                            <SelectItem value="despesa">Despesa</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="confirmado">Confirmado</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent></Card>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div> : (
                <Card className="dashboard-card" data-testid="transacoes-table">
                    <CardContent className="pt-6">
                        {txs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">Tipo</th>
                                        <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">Data</th>
                                        <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">Descricao</th>
                                        <th className="text-left py-3 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Categoria</th>
                                        <th className="text-left py-3 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Conta</th>
                                        <th className="text-right py-3 px-3 text-sm font-medium text-slate-500">Valor</th>
                                        <th className="text-center py-3 px-3 text-sm font-medium text-slate-500">Status</th>
                                        <th className="text-right py-3 px-3 text-sm font-medium text-slate-500"></th>
                                    </tr></thead>
                                    <tbody>
                                        {txs.map(tx => {
                                            const Icon = tipoIcons[tx.tipo] || ArrowUpRight;
                                            return (
                                                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                    <td className="py-3 px-3"><Icon className={`w-5 h-5 ${tipoColors[tx.tipo]}`} /></td>
                                                    <td className="py-3 px-3 text-sm text-slate-600">{tx.data}</td>
                                                    <td className="py-3 px-3 text-sm text-slate-900 max-w-[200px] truncate">{tx.descricao || '-'}</td>
                                                    <td className="py-3 px-3 text-sm text-slate-600 hidden md:table-cell">{tx.categoria_nome || '-'}</td>
                                                    <td className="py-3 px-3 text-sm text-slate-600 hidden md:table-cell">{tx.conta_nome || '-'}</td>
                                                    <td className={`py-3 px-3 text-sm font-bold text-right ${tipoColors[tx.tipo]}`}>{fmt(tx.valor)}</td>
                                                    <td className="py-3 px-3 text-center"><Badge className={statusColors[tx.status]}>{tx.status}</Badge></td>
                                                    <td className="py-3 px-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {tx.status === 'confirmado' && <DropdownMenuItem onClick={() => handleCancel(tx)}><XCircle className="w-4 h-4 mr-2" /> Cancelar (Estorno)</DropdownMenuItem>}
                                                                {tx.status !== 'confirmado' && <DropdownMenuItem onClick={() => handleDelete(tx)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-center py-8 text-slate-400">Nenhuma transacao encontrada</p>}
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Nova Transacao</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo *</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}>
                                    <SelectTrigger data-testid="tx-tipo-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="receita">Receita</SelectItem>
                                        <SelectItem value="despesa">Despesa</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor *</Label>
                                <Input type="number" step="0.01" min="0.01" value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} placeholder="0,00" required data-testid="tx-valor-input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data *</Label>
                                <Input type="date" value={form.data} onChange={(e) => setForm({...form, data: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="confirmado">Confirmado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Conta {form.tipo === 'transferencia' ? 'Origem' : ''}</Label>
                            <Select value={form.conta_id} onValueChange={(v) => setForm({...form, conta_id: v})}>
                                <SelectTrigger data-testid="tx-conta-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhuma</SelectItem>
                                    {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {form.tipo === 'transferencia' && (
                            <div className="space-y-2">
                                <Label>Conta Destino</Label>
                                <Select value={form.conta_destino_id} onValueChange={(v) => setForm({...form, conta_destino_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhuma</SelectItem>
                                        {contas.filter(c => c.id !== form.conta_id).map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={form.categoria_id} onValueChange={(v) => setForm({...form, categoria_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhuma</SelectItem>
                                        {categorias.filter(c => form.tipo === 'transferencia' || c.tipo === form.tipo).map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Centro de Custo</Label>
                                <Select value={form.centro_custo_id} onValueChange={(v) => setForm({...form, centro_custo_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhum</SelectItem>
                                        {centros.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Membro vinculado</Label>
                            <Select value={form.membro_id} onValueChange={(v) => setForm({...form, membro_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhum</SelectItem>
                                    {members.slice(0, 50).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descricao</Label>
                            <textarea value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} placeholder="Descricao..."
                                className="w-full h-16 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-transacao-btn">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Transacao'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
