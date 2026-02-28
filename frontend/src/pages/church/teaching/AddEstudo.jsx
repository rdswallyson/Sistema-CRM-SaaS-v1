import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AddEstudo() {
    const navigate = useNavigate();
    const { estudoId } = useParams();
    const isEditing = !!estudoId;
    const [escolas, setEscolas] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        titulo: '', descricao: '', categoria: '', nivel: 'basico',
        arquivo: '', status: 'active', escola_id: '', turma_id: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eRes, tRes] = await Promise.all([
                    churchAPI.getEscolas(),
                    churchAPI.getTurmas(),
                ]);
                setEscolas(eRes.data || []);
                setTurmas(tRes.data || []);
                if (isEditing) {
                    const sRes = await churchAPI.getEstudo(estudoId);
                    const s = sRes.data;
                    setFormData({
                        titulo: s.titulo || '', descricao: s.descricao || '',
                        categoria: s.categoria || '', nivel: s.nivel || 'basico',
                        arquivo: s.arquivo || '', status: s.status || 'active',
                        escola_id: s.escola_id || '', turma_id: s.turma_id || '',
                    });
                }
            } catch { toast.error('Erro ao carregar dados'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [estudoId, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo.trim()) { toast.error('Titulo e obrigatorio'); return; }
        setSubmitting(true);
        try {
            if (isEditing) {
                await churchAPI.updateEstudo(estudoId, formData);
                toast.success('Estudo atualizado!');
            } else {
                await churchAPI.createEstudo(formData);
                toast.success('Estudo criado!');
            }
            navigate('/dashboard/teaching/studies');
        } catch { toast.error('Erro ao salvar'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/teaching/studies')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <h1 className="font-heading text-2xl font-bold text-slate-900">{isEditing ? 'Editar Estudo' : 'Novo Estudo'}</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Informacoes do Estudo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Titulo *</Label>
                                <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                    placeholder="Ex: Fundamentos da Fe" required data-testid="estudo-titulo-input" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Descricao</Label>
                                <textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                    placeholder="Descricao do estudo..."
                                    className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Input value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                                    placeholder="Ex: Teologia, Lideranca" data-testid="estudo-categoria-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Nivel</Label>
                                <Select value={formData.nivel} onValueChange={(v) => setFormData({...formData, nivel: v})}>
                                    <SelectTrigger data-testid="estudo-nivel-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="basico">Basico</SelectItem>
                                        <SelectItem value="intermediario">Intermediario</SelectItem>
                                        <SelectItem value="avancado">Avancado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Material (link ou URL)</Label>
                                <Input value={formData.arquivo} onChange={(e) => setFormData({...formData, arquivo: e.target.value})}
                                    placeholder="https://... ou link do material" data-testid="estudo-arquivo-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola vinculada</Label>
                                <Select value={formData.escola_id} onValueChange={(v) => setFormData({...formData, escola_id: v})}>
                                    <SelectTrigger data-testid="estudo-escola-select"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhuma</SelectItem>
                                        {escolas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Turma vinculada</Label>
                                <Select value={formData.turma_id} onValueChange={(v) => setFormData({...formData, turma_id: v})}>
                                    <SelectTrigger data-testid="estudo-turma-select"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">Nenhuma</SelectItem>
                                        {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="archived">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-12" disabled={submitting} data-testid="save-estudo-btn">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Salvar Alteracoes' : 'Criar Estudo'}
                </Button>
            </form>
        </div>
    );
}
