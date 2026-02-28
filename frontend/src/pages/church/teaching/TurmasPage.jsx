import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Archive, Loader2, Users, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function TurmasPage() {
    const navigate = useNavigate();
    const [turmas, setTurmas] = useState([]);
    const [escolas, setEscolas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [escolaFilter, setEscolaFilter] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (escolaFilter !== 'all') params.escola_id = escolaFilter;
            if (searchQuery) params.search = searchQuery;
            const [tRes, eRes] = await Promise.all([
                churchAPI.getTurmas(params),
                churchAPI.getEscolas(),
            ]);
            setTurmas(tRes.data || []);
            setEscolas(eRes.data || []);
        } catch { toast.error('Erro ao carregar'); }
        finally { setLoading(false); }
    }, [statusFilter, escolaFilter, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (turma) => {
        if (!window.confirm(`Excluir "${turma.nome}"?`)) return;
        try { await churchAPI.deleteTurma(turma.id); toast.success('Turma excluida'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    const handleStatusChange = async (turma) => {
        const newStatus = turma.status === 'active' ? 'completed' : 'active';
        try { await churchAPI.updateTurma(turma.id, { status: newStatus }); toast.success(newStatus === 'completed' ? 'Turma concluida' : 'Turma reativada'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="turmas-title">Turmas</h1>
                    <p className="text-slate-500">{turmas.length} turma(s) encontrada(s)</p>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/dashboard/teaching/classes/add')} data-testid="add-turma-btn">
                    <Plus className="w-4 h-4 mr-2" /> Nova Turma
                </Button>
            </div>

            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Buscar turma..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-turmas" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36" data-testid="filter-turma-status"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="active">Ativas</SelectItem>
                                <SelectItem value="completed">Concluidas</SelectItem>
                            </SelectContent>
                        </Select>
                        {escolas.length > 0 && (
                            <Select value={escolaFilter} onValueChange={setEscolaFilter}>
                                <SelectTrigger className="w-full sm:w-44" data-testid="filter-turma-escola"><SelectValue placeholder="Escola" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas escolas</SelectItem>
                                    {escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="turmas-grid">
                    {turmas.map(turma => (
                        <Card key={turma.id} className="dashboard-card card-hover cursor-pointer group"
                            data-testid={`turma-${turma.id}`}
                            onClick={() => navigate(`/dashboard/teaching/classes/${turma.id}`)}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <Badge className={turma.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                        {turma.status === 'active' ? 'Ativa' : 'Concluida'}
                                    </Badge>
                                    <div onClick={e => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/teaching/classes/${turma.id}`)}><Eye className="w-4 h-4 mr-2" /> Ver Detalhes</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/teaching/classes/edit/${turma.id}`)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(turma)}><Archive className="w-4 h-4 mr-2" /> {turma.status === 'active' ? 'Concluir' : 'Reativar'}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(turma)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CardTitle className="font-heading text-lg mt-2 group-hover:text-brand-blue transition-colors">{turma.nome}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 text-sm text-slate-500">
                                    {turma.escola_nome && <p className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {turma.escola_nome}</p>}
                                    {turma.professor_nome && <p className="text-xs text-slate-400">Professor: {turma.professor_nome}</p>}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="flex items-center gap-1 text-sm"><Users className="w-4 h-4" /> {turma.aluno_count || 0} aluno(s)</span>
                                        {turma.data_inicio && <span className="text-xs text-slate-400">Inicio: {turma.data_inicio}</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {turmas.length === 0 && (
                        <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Nenhuma turma encontrada</p>
                        </CardContent></Card>
                    )}
                </div>
            )}
        </div>
    );
}
