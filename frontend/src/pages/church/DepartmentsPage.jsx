import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { churchAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Plus, MoreVertical, Edit, Trash2, Users, Loader2, Search,
    Building2, Archive, CheckCircle, X, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_OPTIONS = [
    { value: 'building', label: 'Prédio' },
    { value: 'music', label: 'Música' },
    { value: 'heart', label: 'Coração' },
    { value: 'book', label: 'Livro' },
    { value: 'users', label: 'Pessoas' },
    { value: 'star', label: 'Estrela' },
    { value: 'shield', label: 'Escudo' },
    { value: 'megaphone', label: 'Megafone' },
];

export default function DepartmentsPage() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [members, setMembers] = useState([]);
    const [positions, setPositions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '', description: '', icon: 'building', responsavel_id: '', status: 'active',
        goals: '', meeting_schedule: '',
    });

    // Member selection state
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchFilter, setMemberSearchFilter] = useState('name');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [deptRes, memRes, posRes, catRes] = await Promise.all([
                churchAPI.getDepartments(),
                churchAPI.getMembers({ per_page: 2000 }),
                churchAPI.getMemberPositions(),
                churchAPI.getMemberCategories(),
            ]);
            setDepartments(deptRes.data || []);
            setMembers(memRes.data?.items || []);
            setPositions(posRes.data || []);
            setCategories(catRes.data || []);
        } catch (e) { toast.error('Erro ao carregar dados'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activeDepts = departments.filter(d => d.status === 'active');
    const archivedDepts = departments.filter(d => d.status === 'archived');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            if (editing) {
                await churchAPI.updateDepartment(editing.id, formData);
                // Add selected members
                if (selectedMemberIds.length > 0) {
                    await churchAPI.addDepartmentMembers(editing.id, selectedMemberIds);
                }
                toast.success('Departamento atualizado!');
            } else {
                const res = await churchAPI.createDepartment(formData);
                const newId = res.data?.id;
                if (newId && selectedMemberIds.length > 0) {
                    await churchAPI.addDepartmentMembers(newId, selectedMemberIds);
                }
                toast.success('Departamento criado!');
            }
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (e) { toast.error('Erro ao salvar departamento'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = async (dept) => {
        setEditing(dept);
        setFormData({
            name: dept.name || '', description: dept.description || '', icon: dept.icon || 'building',
            responsavel_id: dept.responsavel_id || '', status: dept.status || 'active',
            goals: dept.goals || '', meeting_schedule: dept.meeting_schedule || '',
        });
        // Load existing members
        try {
            const res = await churchAPI.getDepartmentMembers(dept.id);
            setSelectedMemberIds((res.data || []).map(m => m.id));
        } catch (e) { setSelectedMemberIds([]); }
        setDialogOpen(true);
    };

    const handleDelete = async (dept) => {
        if (!window.confirm(`Excluir "${dept.name}"?`)) return;
        try {
            await churchAPI.deleteDepartment(dept.id);
            toast.success('Departamento excluído');
            fetchData();
        } catch (e) { toast.error('Erro ao excluir'); }
    };

    const handleArchive = async (dept) => {
        const newStatus = dept.status === 'active' ? 'archived' : 'active';
        try {
            await churchAPI.updateDepartment(dept.id, { status: newStatus });
            toast.success(newStatus === 'archived' ? 'Departamento arquivado' : 'Departamento reativado');
            fetchData();
        } catch (e) { toast.error('Erro ao atualizar'); }
    };

    const resetForm = () => {
        setEditing(null);
        setFormData({ name: '', description: '', icon: 'building', responsavel_id: '', status: 'active', goals: '', meeting_schedule: '' });
        setSelectedMemberIds([]);
        setMemberSearchQuery('');
    };

    const getPositionName = (id) => positions.find(p => p.id === id)?.name || '';
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';

    const filteredMembers = members.filter(m => {
        const q = memberSearchQuery.toLowerCase();
        if (!q) return true;
        if (memberSearchFilter === 'name') return m.name?.toLowerCase().includes(q);
        if (memberSearchFilter === 'position') return getPositionName(m.position_id).toLowerCase().includes(q);
        if (memberSearchFilter === 'category') return getCategoryName(m.category_id).toLowerCase().includes(q);
        return m.name?.toLowerCase().includes(q);
    });

    const toggleMember = (memberId) => {
        setSelectedMemberIds(prev =>
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };

    const renderDeptCards = (depts) => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="departments-grid">
            {depts.map(dept => (
                <Card key={dept.id} className="dashboard-card card-hover cursor-pointer group" data-testid={`dept-${dept.id}`}
                    onClick={() => navigate(`/dashboard/departments/${dept.id}`)}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-sky/10 to-brand-blue/10 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-brand-blue" />
                            </div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <Badge className={dept.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                    {dept.status === 'active' ? 'Ativo' : 'Arquivado'}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" data-testid={`dept-menu-${dept.id}`}>
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(dept)}>
                                            <Edit className="w-4 h-4 mr-2" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleArchive(dept)}>
                                            <Archive className="w-4 h-4 mr-2" />
                                            {dept.status === 'active' ? 'Arquivar' : 'Reativar'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(dept)} className="text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <CardTitle className="font-heading text-xl mt-3 group-hover:text-brand-blue transition-colors">
                            {dept.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dept.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{dept.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Users className="w-4 h-4" />
                                <span>{dept.member_count || 0} participantes</span>
                            </div>
                            {/* Member photo previews */}
                            {dept.members_preview && dept.members_preview.length > 0 && (
                                <div className="flex -space-x-2">
                                    {dept.members_preview.slice(0, 3).map((m, i) => (
                                        <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden" style={{ zIndex: 3 - i }}>
                                            {m.photo_url ? (
                                                <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">{m.name?.[0]}</span>
                                            )}
                                        </div>
                                    ))}
                                    {dept.member_count > 3 && (
                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500">
                                            +{dept.member_count - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {dept.responsavel_name && (
                            <p className="text-xs text-slate-400 mt-2">Responsável: {dept.responsavel_name}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
            {depts.length === 0 && (
                <Card className="dashboard-card col-span-full">
                    <CardContent className="py-8 text-center">
                        <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Nenhum departamento {activeTab === 'archived' ? 'arquivado' : 'encontrado'}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Departamentos</h1>
                    <p className="text-slate-500">Gerencie os departamentos da sua igreja</p>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="add-department-btn">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Departamento
                </Button>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading">
                            {editing ? 'Editar Departamento' : 'Criar Departamento'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Nome do Departamento *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Louvor e Adoração" required data-testid="dept-name-input" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Descrição</Label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição do departamento..." data-testid="dept-description-input"
                                    className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Ícone</Label>
                                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                                    <SelectTrigger data-testid="dept-icon-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ICON_OPTIONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Responsável</Label>
                                <Select value={formData.responsavel_id} onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}>
                                    <SelectTrigger data-testid="dept-responsavel-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="archived">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Agenda de Reuniões</Label>
                                <Input value={formData.meeting_schedule} onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                                    placeholder="Ex: Sábados às 15h" />
                            </div>
                        </div>

                        {/* Member Selection */}
                        <div className="border rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" /> Adicionar Membros
                                </Label>
                                <Badge variant="outline">{selectedMemberIds.length} selecionados</Badge>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)}
                                        placeholder="Buscar membro..." className="pl-10" data-testid="dept-member-search" />
                                </div>
                                <Select value={memberSearchFilter} onValueChange={setMemberSearchFilter}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Nome</SelectItem>
                                        <SelectItem value="position">Cargo</SelectItem>
                                        <SelectItem value="category">Categoria</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                                {filteredMembers.length > 0 ? filteredMembers.slice(0, 50).map(m => (
                                    <div key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMemberIds.includes(m.id) ? 'bg-brand-sky/10' : 'hover:bg-slate-50'}`}
                                        onClick={() => toggleMember(m.id)} data-testid={`select-member-${m.id}`}>
                                        <div className={`h-4 w-4 shrink-0 rounded-sm border shadow ${selectedMemberIds.includes(m.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'} flex items-center justify-center`}>
                                            {selectedMemberIds.includes(m.id) && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                                <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {getPositionName(m.position_id) || getCategoryName(m.category_id) || m.status}
                                            </p>
                                        </div>
                                        {selectedMemberIds.includes(m.id) && <CheckCircle className="w-4 h-4 text-brand-sky shrink-0" />}
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-4">Nenhum membro encontrado</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11" disabled={submitting} data-testid="save-dept-btn">
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {editing ? 'Salvar Alterações' : 'Criar Departamento'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Tabs */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList data-testid="dept-tabs">
                        <TabsTrigger value="active" data-testid="tab-active">
                            Ativos ({activeDepts.length})
                        </TabsTrigger>
                        <TabsTrigger value="archived" data-testid="tab-archived">
                            Arquivados ({archivedDepts.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-6">
                        {renderDeptCards(activeDepts)}
                    </TabsContent>
                    <TabsContent value="archived" className="mt-6">
                        {renderDeptCards(archivedDepts)}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
