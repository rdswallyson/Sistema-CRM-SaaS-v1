import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../components/ui/dialog';
import { Loader2, Search, Users, BookOpen, ClipboardList, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AcompanhamentoPage() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberData, setMemberData] = useState(null);
    const [loadingMember, setLoadingMember] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [estudos, setEstudos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [editingProg, setEditingProg] = useState(null);
    const [progForm, setProgForm] = useState({ membro_id: '', turma_id: '', estudo_id: '', status: 'em_andamento', nota: '', observacao: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, eRes, tRes] = await Promise.all([
                    churchAPI.getMembers({ per_page: 2000 }),
                    churchAPI.getEstudos(),
                    churchAPI.getTurmas(),
                ]);
                setMembers(mRes.data?.items || []);
                setEstudos(eRes.data || []);
                setTurmas(tRes.data || []);
            } catch { toast.error('Erro ao carregar'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const selectMember = async (member) => {
        setSelectedMember(member);
        setLoadingMember(true);
        try {
            const res = await churchAPI.getProgressoMembro(member.id);
            setMemberData(res.data);
        } catch { toast.error('Erro ao carregar dados do membro'); }
        finally { setLoadingMember(false); }
    };

    const openAddProgress = () => {
        if (!selectedMember) return;
        setEditingProg(null);
        setProgForm({ membro_id: selectedMember.id, turma_id: '', estudo_id: '', status: 'em_andamento', nota: '', observacao: '' });
        setDialogOpen(true);
    };

    const openEditProgress = (p) => {
        setEditingProg(p);
        setProgForm({ membro_id: p.membro_id, turma_id: p.turma_id || '', estudo_id: p.estudo_id || '', status: p.status, nota: p.nota || '', observacao: p.observacao || '' });
        setDialogOpen(true);
    };

    const handleSubmitProgress = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = { ...progForm, nota: progForm.nota ? parseFloat(progForm.nota) : null };
            if (editingProg) {
                await churchAPI.updateProgresso(editingProg.id, data);
                toast.success('Progresso atualizado!');
            } else {
                await churchAPI.createProgresso(data);
                toast.success('Progresso registrado!');
            }
            setDialogOpen(false);
            selectMember(selectedMember);
        } catch { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteProgress = async (progId) => {
        if (!window.confirm('Excluir este progresso?')) return;
        try { await churchAPI.deleteProgresso(progId); toast.success('Removido'); selectMember(selectedMember); }
        catch { toast.error('Erro'); }
    };

    const filteredMembers = members.filter(m => !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="acompanhamento-title">Acompanhamento Pessoal</h1>
                <p className="text-slate-500">Controle individual de desenvolvimento dos alunos</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card className="dashboard-card">
                        <CardHeader><CardTitle className="font-heading text-base">Selecionar Membro</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-acompanhamento" />
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-1">
                                {filteredMembers.slice(0, 50).map(m => (
                                    <button key={m.id} onClick={() => selectMember(m)}
                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${selectedMember?.id === m.id ? 'bg-brand-sky/10 text-brand-sky-active' : 'hover:bg-slate-50 text-slate-700'}`}
                                        data-testid={`select-member-${m.id}`}>
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>
                                        </div>
                                        <span className="text-sm font-medium truncate">{m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-4">
                    {!selectedMember ? (
                        <Card className="dashboard-card"><CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Selecione um membro para ver o acompanhamento</p>
                        </CardContent></Card>
                    ) : loadingMember ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="font-heading text-lg font-bold text-slate-900" data-testid="member-name-display">{selectedMember.name}</h2>
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={openAddProgress} data-testid="add-progresso-btn">
                                    <Plus className="w-4 h-4 mr-1" /> Registrar Progresso
                                </Button>
                            </div>

                            {memberData?.turmas?.length > 0 && (
                                <Card className="dashboard-card">
                                    <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Turmas</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {memberData.turmas.map(t => (
                                                <Badge key={t.id} variant="outline" className="text-xs">{t.nome} <span className="ml-1 text-slate-400">({t.status === 'active' ? 'Ativa' : 'Concluida'})</span></Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="dashboard-card" data-testid="progressos-list">
                                <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Progresso ({memberData?.progressos?.length || 0})</CardTitle></CardHeader>
                                <CardContent>
                                    {memberData?.progressos?.length > 0 ? (
                                        <div className="space-y-3">
                                            {memberData.progressos.map(p => (
                                                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                                                    <div className="flex-1">
                                                        {p.estudo_titulo && <p className="text-sm font-medium text-slate-900">{p.estudo_titulo}</p>}
                                                        {p.turma_nome && <p className="text-xs text-slate-500">Turma: {p.turma_nome}</p>}
                                                        {p.observacao && <p className="text-xs text-slate-400 mt-1">{p.observacao}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {p.nota != null && <Badge variant="outline" className="text-xs">Nota: {p.nota}</Badge>}
                                                        <Badge className={p.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                                            {p.status === 'concluido' ? 'Concluido' : 'Em andamento'}
                                                        </Badge>
                                                        <Button variant="ghost" size="sm" onClick={() => openEditProgress(p)}><Edit className="w-3 h-3" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProgress(p.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-center py-4 text-slate-400">Nenhum progresso registrado</p>}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{editingProg ? 'Editar' : 'Registrar'} Progresso</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmitProgress} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Turma</Label>
                            <Select value={progForm.turma_id} onValueChange={(v) => setProgForm({...progForm, turma_id: v})}>
                                <SelectTrigger data-testid="prog-turma-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhuma</SelectItem>
                                    {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estudo</Label>
                            <Select value={progForm.estudo_id} onValueChange={(v) => setProgForm({...progForm, estudo_id: v})}>
                                <SelectTrigger data-testid="prog-estudo-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhum</SelectItem>
                                    {estudos.map(e => <SelectItem key={e.id} value={e.id}>{e.titulo}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={progForm.status} onValueChange={(v) => setProgForm({...progForm, status: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                                    <SelectItem value="concluido">Concluido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nota (opcional)</Label>
                            <Input type="number" step="0.1" min="0" max="10" value={progForm.nota} onChange={(e) => setProgForm({...progForm, nota: e.target.value})}
                                placeholder="0 a 10" data-testid="prog-nota-input" />
                        </div>
                        <div className="space-y-2">
                            <Label>Observacao</Label>
                            <textarea value={progForm.observacao} onChange={(e) => setProgForm({...progForm, observacao: e.target.value})}
                                placeholder="Observacoes do professor..." className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-progresso-btn">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingProg ? 'Salvar' : 'Registrar')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
