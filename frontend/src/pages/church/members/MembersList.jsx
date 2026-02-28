import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { memberStatusLabels, memberStatusColors } from '../../../lib/utils';
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
    Search, MoreVertical, Users, Edit, Trash2, Phone, Mail, Loader2, Eye,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MembersList() {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [positions, setPositions] = useState([]);
    const perPage = 20;

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, per_page: perPage };
            if (searchQuery) params.search = searchQuery;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (categoryFilter !== 'all') params.category_id = categoryFilter;
            if (positionFilter !== 'all') params.position_id = positionFilter;

            const res = await churchAPI.getMembers(params);
            setMembers(res.data.items || []);
            setTotal(res.data.total || 0);
            setPages(res.data.pages || 1);
        } catch (error) {
            toast.error('Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, statusFilter, categoryFilter, positionFilter]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catRes, posRes] = await Promise.all([
                    churchAPI.getMemberCategories(),
                    churchAPI.getMemberPositions(),
                ]);
                setCategories(catRes.data || []);
                setPositions(posRes.data || []);
            } catch (e) {}
        };
        fetchFilters();
    }, []);

    const handleDelete = async (member) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${member.name}"?`)) return;
        try {
            await churchAPI.deleteMember(member.id);
            toast.success('Membro excluído com sucesso');
            fetchMembers();
        } catch (error) {
            toast.error('Erro ao excluir membro');
        }
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        setPage(1);
    };

    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';
    const getPositionName = (id) => positions.find(p => p.id === id)?.name || '';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Gestão de Membros</h1>
                    <p className="text-slate-500">{total} membros cadastrados</p>
                </div>
                <Button
                    className="bg-slate-900 hover:bg-slate-800"
                    onClick={() => navigate('/dashboard/members/add')}
                    data-testid="add-member-btn"
                >
                    <Users className="w-4 h-4 mr-2" />
                    Novo Membro
                </Button>
            </div>

            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome, email ou telefone..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                                data-testid="search-members-input"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40" data-testid="status-filter">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos status</SelectItem>
                                <SelectItem value="visitor">Visitantes</SelectItem>
                                <SelectItem value="new_convert">Novos Convertidos</SelectItem>
                                <SelectItem value="member">Membros</SelectItem>
                                <SelectItem value="leader">Líderes</SelectItem>
                            </SelectContent>
                        </Select>
                        {categories.length > 0 && (
                            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-40" data-testid="category-filter">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas categorias</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {positions.length > 0 && (
                            <Select value={positionFilter} onValueChange={(v) => { setPositionFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-full sm:w-40" data-testid="position-filter">
                                    <SelectValue placeholder="Cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos cargos</SelectItem>
                                    {positions.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="dashboard-card" data-testid="members-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Membros ({total})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
                        </div>
                    ) : members.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Nome</th>
                                            <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm hidden md:table-cell">Contato</th>
                                            <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm hidden lg:table-cell">Cargo</th>
                                            <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                                            <th className="text-right py-3 px-4 font-medium text-slate-500 text-sm">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => (
                                            <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {member.photo_url ? (
                                                                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{member.name}</p>
                                                            {getCategoryName(member.category_id) && (
                                                                <p className="text-xs text-slate-500">{getCategoryName(member.category_id)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 hidden md:table-cell">
                                                    <div className="space-y-1">
                                                        {member.email && (
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Mail className="w-3 h-3" /> {member.email}
                                                            </div>
                                                        )}
                                                        {member.phone && (
                                                            <div className="flex items-center gap-1 text-sm text-slate-600">
                                                                <Phone className="w-3 h-3" /> {member.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 hidden lg:table-cell">
                                                    <span className="text-sm text-slate-600">
                                                        {getPositionName(member.position_id) || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={memberStatusColors[member.status]}>
                                                        {memberStatusLabels[member.status]}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/members/${member.id}`)} data-testid={`view-member-${member.id}`}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/members/${member.id}`)}>
                                                                    <Eye className="w-4 h-4 mr-2" /> Ver Perfil
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/members/edit/${member.id}`)}>
                                                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDelete(member)} className="text-red-600">
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pages > 1 && (
                                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                    <p className="text-sm text-slate-500">
                                        Página {page} de {pages} ({total} resultados)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="prev-page">
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} data-testid="next-page">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum membro encontrado</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
