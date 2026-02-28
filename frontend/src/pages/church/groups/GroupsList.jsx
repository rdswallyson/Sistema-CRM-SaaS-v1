import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
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
    Plus, Search, MoreVertical, Users, Edit, Trash2, Archive, Loader2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GroupsList() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (categoryFilter !== 'all') params.category_id = categoryFilter;
            if (departmentFilter !== 'all') params.department_id = departmentFilter;
            if (searchQuery) params.search = searchQuery;
            const [gRes, cRes, dRes] = await Promise.all([
                churchAPI.getGroups(params),
                churchAPI.getGroupCategories(),
                churchAPI.getDepartments(),
            ]);
            setGroups(gRes.data || []);
            setCategories(cRes.data || []);
            setDepartments(dRes.data || []);
        } catch (e) { toast.error('Erro ao carregar grupos'); }
        finally { setLoading(false); }
    }, [statusFilter, categoryFilter, departmentFilter, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (group) => {
        if (!window.confirm(`Excluir "${group.name}"?`)) return;
        try {
            await churchAPI.deleteGroup(group.id);
            toast.success('Grupo excluído');
            fetchData();
        } catch (e) { toast.error('Erro ao excluir'); }
    };

    const handleArchive = async (group) => {
        const newStatus = group.status === 'active' ? 'closed' : 'active';
        try {
            await churchAPI.updateGroup(group.id, { status: newStatus });
            toast.success(newStatus === 'closed' ? 'Grupo encerrado' : 'Grupo reativado');
            fetchData();
        } catch (e) { toast.error('Erro'); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Grupos</h1>
                    <p className="text-slate-500">{groups.length} grupo(s) encontrado(s)</p>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/dashboard/groups/add')} data-testid="add-group-btn">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Grupo
                </Button>
            </div>

            {/* Filters */}
            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Buscar grupo..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="search-groups" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativos</SelectItem>
                                <SelectItem value="closed">Encerrados</SelectItem>
                            </SelectContent>
                        </Select>
                        {categories.length > 0 && (
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-40" data-testid="filter-category"><SelectValue placeholder="Categoria" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas categorias</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {departments.length > 0 && (
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-full sm:w-40" data-testid="filter-dept"><SelectValue placeholder="Departamento" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos deptos</SelectItem>
                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Groups Grid */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="groups-grid">
                    {groups.map(group => (
                        <Card key={group.id} className="dashboard-card card-hover cursor-pointer group"
                            data-testid={`group-${group.id}`}
                            onClick={() => navigate(`/dashboard/groups/${group.id}`)}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {group.category_name && (
                                            <Badge style={{ backgroundColor: group.category_color + '20', color: group.category_color, borderColor: group.category_color + '40' }}
                                                className="border text-xs">{group.category_name}</Badge>
                                        )}
                                        <Badge className={group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                            {group.status === 'active' ? 'Ativo' : 'Encerrado'}
                                        </Badge>
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/groups/${group.id}`)}>
                                                    <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/groups/edit/${group.id}`)}>
                                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleArchive(group)}>
                                                    <Archive className="w-4 h-4 mr-2" /> {group.status === 'active' ? 'Encerrar' : 'Reativar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(group)} className="text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CardTitle className="font-heading text-lg mt-2 group-hover:text-brand-blue transition-colors">
                                    {group.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {group.department_name && (
                                    <p className="text-xs text-slate-500 mb-2">Depto: {group.department_name}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Users className="w-4 h-4" /> {group.member_count || 0} participantes
                                    </div>
                                    {group.members_preview?.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {group.members_preview.slice(0, 3).map((m, i) => (
                                                <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden" style={{ zIndex: 3 - i }}>
                                                    {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                                        <span className="text-[10px] font-bold text-slate-400">{m.name?.[0]}</span>}
                                                </div>
                                            ))}
                                            {group.member_count > 3 && (
                                                <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500">
                                                    +{group.member_count - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {group.leader_name && (
                                    <p className="text-xs text-slate-400 mt-2">Líder: {group.leader_name}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {groups.length === 0 && (
                        <Card className="dashboard-card col-span-full">
                            <CardContent className="py-8 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Nenhum grupo encontrado</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
