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
import { ArrowLeft, Save, Loader2, Search, UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AddTurma() {
    const navigate = useNavigate();
    const { turmaId } = useParams();
    const isEditing = !!turmaId;
    const [members, setMembers] = useState([]);
    const [escolas, setEscolas] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [formData, setFormData] = useState({
        nome: '', escola_id: '', professor_id: '',
        data_inicio: '', data_fim: '', status: 'active',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, eRes] = await Promise.all([
                    churchAPI.getMembers({ per_page: 2000 }),
                    churchAPI.getEscolas(),
                ]);
                setMembers(mRes.data?.items || []);
                setEscolas(eRes.data || []);
                if (isEditing) {
                    const tRes = await churchAPI.getTurma(turmaId);
                    const t = tRes.data;
                    setFormData({
                        nome: t.nome || '', escola_id: t.escola_id || '',
                        professor_id: t.professor_id || '',
                        data_inicio: t.data_inicio || '', data_fim: t.data_fim || '',
                        status: t.status || 'active',
                    });
                    setSelectedMemberIds((t.alunos || []).map(a => a.id));
                }
            } catch { toast.error('Erro ao carregar dados'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [turmaId, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome.trim()) { toast.error('Nome e obrigatorio'); return; }
        setSubmitting(true);
        try {
            if (isEditing) {
                await churchAPI.updateTurma(turmaId, formData);
                if (selectedMemberIds.length > 0) {
                    await churchAPI.addTurmaMembers(turmaId, selectedMemberIds);
                }
                toast.success('Turma atualizada!');
            } else {
                const res = await churchAPI.createTurma(formData);
                const newId = res.data?.id;
                if (newId && selectedMemberIds.length > 0) {
                    await churchAPI.addTurmaMembers(newId, selectedMemberIds);
                }
                toast.success('Turma criada!');
            }
            navigate('/dashboard/teaching/classes');
        } catch { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    const filteredMembers = members.filter(m => {
        if (!memberSearch) return true;
        return m.name?.toLowerCase().includes(memberSearch.toLowerCase());
    });

    const toggleMember = (id) => {
        setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/teaching/classes')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <h1 className="font-heading text-2xl font-bold text-slate-900">{isEditing ? 'Editar Turma' : 'Nova Turma'}</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Informacoes da Turma</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Nome da Turma *</Label>
                                <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                    placeholder="Ex: Turma de Lideres 2026" required data-testid="turma-nome-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola</Label>
                                <Select value={formData.escola_id} onValueChange={(v) => setFormData({...formData, escola_id: v})}>
                                    <SelectTrigger data-testid="turma-escola-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhuma</SelectItem>
                                        {escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Professor</Label>
                                <Select value={formData.professor_id} onValueChange={(v) => setFormData({...formData, professor_id: v})}>
                                    <SelectTrigger data-testid="turma-professor-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhum</SelectItem>
                                        {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Data Inicio</Label>
                                <Input type="date" value={formData.data_inicio} onChange={(e) => setFormData({...formData, data_inicio: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Fim</Label>
                                <Input type="date" value={formData.data_fim} onChange={(e) => setFormData({...formData, data_fim: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="completed">Concluida</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dashboard-card mb-6">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <UserPlus className="w-5 h-5" /> Alunos
                            <Badge variant="outline">{selectedMemberIds.length} selecionados</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Buscar membro..." className="pl-10" data-testid="turma-member-search" />
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-1 border rounded-lg p-2">
                            {filteredMembers.slice(0, 60).map(m => (
                                <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMemberIds.includes(m.id) ? 'bg-brand-sky/10' : 'hover:bg-slate-50'}`}
                                    data-testid={`select-aluno-${m.id}`}>
                                    <Checkbox checked={selectedMemberIds.includes(m.id)} onCheckedChange={() => toggleMember(m.id)} />
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                                    </div>
                                    {selectedMemberIds.includes(m.id) && <CheckCircle className="w-4 h-4 text-brand-sky shrink-0" />}
                                </label>
                            ))}
                            {filteredMembers.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Nenhum membro encontrado</p>}
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-12" disabled={submitting} data-testid="save-turma-btn">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Salvar Alteracoes' : 'Criar Turma'}
                </Button>
            </form>
        </div>
    );
}
