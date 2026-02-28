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
import {
    Plus, Search, MoreVertical, Edit, Trash2, Archive, Loader2, BookOpen, Link as LinkIcon, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const nivelLabels = { basico: 'Basico', intermediario: 'Intermediario', avancado: 'Avancado' };
const nivelColors = { basico: 'bg-green-100 text-green-700', intermediario: 'bg-amber-100 text-amber-700', avancado: 'bg-red-100 text-red-700' };

export default function EstudosPage() {
    const navigate = useNavigate();
    const [estudos, setEstudos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [nivelFilter, setNivelFilter] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (nivelFilter !== 'all') params.nivel = nivelFilter;
            if (searchQuery) params.search = searchQuery;
            const res = await churchAPI.getEstudos(params);
            setEstudos(res.data || []);
        } catch { toast.error('Erro ao carregar estudos'); }
        finally { setLoading(false); }
    }, [statusFilter, nivelFilter, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (estudo) => {
        if (!window.confirm(`Excluir "${estudo.titulo}"?`)) return;
        try { await churchAPI.deleteEstudo(estudo.id); toast.success('Estudo excluido'); fetchData(); }
        catch { toast.error('Erro ao excluir'); }
    };

    const handleArchive = async (estudo) => {
        const newStatus = estudo.status === 'active' ? 'archived' : 'active';
        try { await churchAPI.updateEstudo(estudo.id, { status: newStatus }); toast.success(newStatus === 'archived' ? 'Estudo arquivado' : 'Estudo reativado'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="estudos-title">Estudos</h1>
                    <p className="text-slate-500">{estudos.length} estudo(s) encontrado(s)</p>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/dashboard/teaching/studies/add')} data-testid="add-estudo-btn">
                    <Plus className="w-4 h-4 mr-2" /> Novo Estudo
                </Button>
            </div>

            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Buscar estudo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-estudos" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativos</SelectItem>
                                <SelectItem value="archived">Arquivados</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={nivelFilter} onValueChange={setNivelFilter}>
                            <SelectTrigger className="w-full sm:w-40" data-testid="filter-nivel"><SelectValue placeholder="Nivel" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos niveis</SelectItem>
                                <SelectItem value="basico">Basico</SelectItem>
                                <SelectItem value="intermediario">Intermediario</SelectItem>
                                <SelectItem value="avancado">Avancado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="estudos-grid">
                    {estudos.map(estudo => (
                        <Card key={estudo.id} className="dashboard-card card-hover" data-testid={`estudo-${estudo.id}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={nivelColors[estudo.nivel] || 'bg-slate-100 text-slate-600'}>{nivelLabels[estudo.nivel] || estudo.nivel}</Badge>
                                        <Badge className={estudo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                            {estudo.status === 'active' ? 'Ativo' : 'Arquivado'}
                                        </Badge>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => navigate(`/dashboard/teaching/studies/edit/${estudo.id}`)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleArchive(estudo)}><Archive className="w-4 h-4 mr-2" /> {estudo.status === 'active' ? 'Arquivar' : 'Reativar'}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(estudo)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="font-heading text-lg mt-2">{estudo.titulo}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {estudo.descricao && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{estudo.descricao}</p>}
                                {estudo.categoria && <p className="text-xs text-slate-400 mb-1">Categoria: {estudo.categoria}</p>}
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                                    {estudo.escola_nome && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {estudo.escola_nome}</span>}
                                    {estudo.turma_nome && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {estudo.turma_nome}</span>}
                                    {estudo.arquivo && <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Material</span>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {estudos.length === 0 && (
                        <Card className="dashboard-card col-span-full"><CardContent className="py-8 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Nenhum estudo encontrado</p>
                        </CardContent></Card>
                    )}
                </div>
            )}
        </div>
    );
}
