import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { ArrowLeft, Save, Loader2, Search, UserPlus, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AddGroup() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const isEditing = !!groupId;
    const [members, setMembers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [memberCategories, setMemberCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberFilter, setMemberFilter] = useState('name');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [formData, setFormData] = useState({
        name: '', description: '', category_id: '', department_id: '',
        leader_id: '', status: 'active', start_date: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, cRes, dRes, pRes, mcRes] = await Promise.all([
                    churchAPI.getMembers({ per_page: 2000 }),
                    churchAPI.getGroupCategories(),
                    churchAPI.getDepartments(),
                    churchAPI.getMemberPositions(),
                    churchAPI.getMemberCategories(),
                ]);
                setMembers(mRes.data?.items || []);
                setCategories(cRes.data || []);
                setDepartments(dRes.data || []);
                setPositions(pRes.data || []);
                setMemberCategories(mcRes.data || []);
                if (isEditing) {
                    const gRes = await churchAPI.getGroup(groupId);
                    const g = gRes.data;
                    setFormData({
                        name: g.name || '', description: g.description || '',
                        category_id: g.category_id || '', department_id: g.department_id || '',
                        leader_id: g.leader_id || '', status: g.status || 'active',
                        start_date: g.start_date || '',
                    });
                    setSelectedMemberIds((g.members || []).map(m => m.id));
                }
            } catch (e) { toast.error('Erro ao carregar dados'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [groupId, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
        setSubmitting(true);
        try {
            if (isEditing) {
                await churchAPI.updateGroup(groupId, formData);
                if (selectedMemberIds.length > 0) {
                    await churchAPI.addGroupMembers(groupId, selectedMemberIds);
                }
                toast.success('Grupo atualizado!');
            } else {
                const res = await churchAPI.createGroup(formData);
                const newId = res.data?.id;
                if (newId && selectedMemberIds.length > 0) {
                    await churchAPI.addGroupMembers(newId, selectedMemberIds);
                }
                toast.success('Grupo criado!');
            }
            navigate('/dashboard/groups');
        } catch (e) { toast.error('Erro ao salvar grupo'); }
        finally { setSubmitting(false); }
    };

    const getPositionName = (id) => positions.find(p => p.id === id)?.name || '';
    const getCategoryName = (id) => memberCategories.find(c => c.id === id)?.name || '';

    const filteredMembers = members.filter(m => {
        const q = memberSearch.toLowerCase();
        if (!q) return true;
        if (memberFilter === 'name') return m.name?.toLowerCase().includes(q);
        if (memberFilter === 'position') return getPositionName(m.position_id).toLowerCase().includes(q);
        if (memberFilter === 'category') return getCategoryName(m.category_id).toLowerCase().includes(q);
        return m.name?.toLowerCase().includes(q);
    });

    const toggleMember = (id) => {
        setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/groups')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <h1 className="font-heading text-2xl font-bold text-slate-900">
                    {isEditing ? 'Editar Grupo' : 'Criar Grupo'}
                </h1>
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Informações do Grupo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Nome do Grupo *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Célula Centro" required data-testid="group-name-input" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Descrição</Label>
                                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Descrição do grupo..."
                                    className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                                    <SelectTrigger data-testid="group-category-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Departamento (opcional)</Label>
                                <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Líder Responsável</Label>
                                <Select value={formData.leader_id} onValueChange={(v) => setFormData({...formData, leader_id: v})}>
                                    <SelectTrigger data-testid="group-leader-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Início</Label>
                                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="closed">Encerrado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Member Selection */}
                <Card className="dashboard-card mb-6">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <UserPlus className="w-5 h-5" /> Participantes
                            <Badge variant="outline">{selectedMemberIds.length} selecionados</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Buscar membro..." className="pl-10" data-testid="group-member-search" />
                            </div>
                            <Select value={memberFilter} onValueChange={setMemberFilter}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Nome</SelectItem>
                                    <SelectItem value="position">Cargo</SelectItem>
                                    <SelectItem value="category">Categoria</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1 border rounded-lg p-2">
                            {filteredMembers.slice(0, 60).map(m => (
                                <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMemberIds.includes(m.id) ? 'bg-brand-sky/10' : 'hover:bg-slate-50'}`}
                                    data-testid={`select-member-${m.id}`}>
                                    <Checkbox checked={selectedMemberIds.includes(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                                        <p className="text-xs text-slate-500">{getPositionName(m.position_id) || m.status}</p>
                                    </div>
                                    {selectedMemberIds.includes(m.id) && <CheckCircle className="w-4 h-4 text-brand-sky shrink-0" />}
                                </label>
                            ))}
                            {filteredMembers.length === 0 && (
                                <p className="text-center text-sm text-slate-400 py-4">Nenhum membro encontrado</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-12" disabled={submitting} data-testid="save-group-btn">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Grupo'}
                </Button>
            </form>
        </div>
    );
}
