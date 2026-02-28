import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Archive, Loader2, School, Users, BookOpen, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function EscolasPage() {
    const navigate = useNavigate();
    const [escolas, setEscolas] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ nome: '', descricao: '', responsavel_id: '', departamento_id: '', status: 'active' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            const [eRes, dRes, mRes] = await Promise.all([
                churchAPI.getEscolas(params),
                churchAPI.getDepartments(),
                churchAPI.getMembers({ per_page: 2000 }),
            ]);
            setEscolas(eRes.data || []);
            setDepartments(dRes.data || []);
            setMembers(mRes.data?.items || []);
        } catch { toast.error('Erro ao carregar'); }
        finally { setLoading(false); }
    }, [searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome.trim()) return;
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateEscola(editing.id, formData); toast.success('Escola atualizada!'); }
            else { await churchAPI.createEscola(formData); toast.success('Escola criada!'); }
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (escola) => {
        setEditing(escola);
        setFormData({ nome: escola.nome, descricao: escola.descricao || '', responsavel_id: escola.responsavel_id || '', departamento_id: escola.departamento_id || '', status: escola.status || 'active' });
        setDialogOpen(true);
    };

    const handleDelete = async (escola) => {
        if (!window.confirm(`Excluir "${escola.nome}"?`)) return;
        try { await churchAPI.deleteEscola(escola.id); toast.success('Escola excluida'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    const handleArchive = async (escola) => {
        const newStatus = escola.status === 'active' ? 'archived' : 'active';
        try { await churchAPI.updateEscola(escola.id, { status: newStatus }); toast.success(newStatus === 'archived' ? 'Escola arquivada' : 'Escola reativada'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    const resetForm = () => { setEditing(null); setFormData({ nome: '', descricao: '', responsavel_id: '', departamento_id: '', status: 'active' }); };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="escolas-title">Escolas</h1>
                    <p className="text-slate-500">{escolas.length} escola(s)</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-escola-btn">
                            <Plus className="w-4 h-4 mr-2" /> Nova Escola
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Escola</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                    placeholder="Ex: Escola de Lideres" required data-testid="escola-nome-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Descricao</Label>
                                <textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                    placeholder="Descricao..." className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Responsavel</Label>
                                <Select value={formData.responsavel_id} onValueChange={(v) => setFormData({...formData, responsavel_id: v})}>
                                    <SelectTrigger data-testid="escola-responsavel-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhum</SelectItem>
                                        {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Departamento vinculado</Label>
                                <Select value={formData.departamento_id} onValueChange={(v) => setFormData({...formData, departamento_id: v})}>
                                    <SelectTrigger data-testid="escola-dept-select"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhum</SelectItem>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-escola-btn">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar' : 'Criar')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Buscar escola..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-escolas" />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="escolas-grid">
                    {escolas.map(escola => (
                        <Card key={escola.id} className="dashboard-card card-hover" data-testid={`escola-${escola.id}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <Badge className={escola.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                        {escola.status === 'active' ? 'Ativa' : 'Arquivada'}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(escola)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleArchive(escola)}><Archive className="w-4 h-4 mr-2" /> {escola.status === 'active' ? 'Arquivar' : 'Reativar'}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(escola)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="font-heading text-lg mt-2">
                                    <div className="flex items-center gap-2">
                                        <School className="w-5 h-5 text-brand-sky" />
                                        {escola.nome}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {escola.descricao && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{escola.descricao}</p>}
                                <div className="space-y-1 text-xs text-slate-400">
                                    {escola.responsavel_nome && <p>Responsavel: <span className="text-slate-600">{escola.responsavel_nome}</span></p>}
                                    {escola.departamento_nome && <p>Departamento: <span className="text-slate-600">{escola.departamento_nome}</span></p>}
                                    <p className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {escola.turma_count || 0} turma(s)</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {escolas.length === 0 && (
                        <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center">
                            <School className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Nenhuma escola encontrada</p>
                        </CardContent></Card>
                    )}
                </div>
            )}
        </div>
    );
}
