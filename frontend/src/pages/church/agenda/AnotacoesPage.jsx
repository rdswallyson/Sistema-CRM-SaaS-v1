import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Plus, Loader2, Edit, Trash2, StickyNote, Clock, Palette } from 'lucide-react';
import { toast } from 'sonner';

const CORES = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'];
const EMPTY_FORM = { titulo: '', conteudo: '', data_lembrete: '', hora_lembrete: '', cor: '#6366f1' };

export default function AnotacoesPage() {
    const [anotacoes, setAnotacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchAnotacoes(); }, []);

    const fetchAnotacoes = async () => {
        setLoading(true);
        try { const r = await churchAPI.getAnotacoes(); setAnotacoes(r.data || []); }
        catch { toast.error('Erro ao carregar anotacoes'); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo) return toast.error('Titulo obrigatorio');
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateAnotacao(editing.id, formData); toast.success('Anotacao atualizada'); }
            else { await churchAPI.createAnotacao(formData); toast.success('Anotacao criada'); }
            setDialogOpen(false); setEditing(null); setFormData({ ...EMPTY_FORM }); fetchAnotacoes();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar'); }
        setSubmitting(false);
    };

    const handleEdit = (a) => { setEditing(a); setFormData({ ...EMPTY_FORM, ...a }); setDialogOpen(true); };
    const handleDelete = async (id) => { if (!window.confirm('Remover anotacao?')) return; try { await churchAPI.deleteAnotacao(id); toast.success('Removida'); fetchAnotacoes(); } catch { toast.error('Erro'); } };

    return (
        <div className="space-y-6" data-testid="anotacoes-page">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-800">Minhas Anotacoes</h1><p className="text-sm text-slate-500">Lembretes e notas pessoais (visiveis apenas para voce)</p></div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setFormData({ ...EMPTY_FORM }); } }}>
                    <DialogTrigger asChild><Button data-testid="add-anotacao-btn"><Plus className="h-4 w-4 mr-2" />Nova Anotacao</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{editing ? 'Editar Anotacao' : 'Nova Anotacao'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><Label>Titulo *</Label><Input value={formData.titulo} onChange={e => setFormData(p => ({...p, titulo: e.target.value}))} required data-testid="anotacao-titulo-input" /></div>
                            <div><Label>Conteudo</Label><Textarea value={formData.conteudo} onChange={e => setFormData(p => ({...p, conteudo: e.target.value}))} rows={4} data-testid="anotacao-conteudo-input" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Data Lembrete</Label><Input type="date" value={formData.data_lembrete} onChange={e => setFormData(p => ({...p, data_lembrete: e.target.value}))} /></div>
                                <div><Label>Hora Lembrete</Label><Input type="time" value={formData.hora_lembrete} onChange={e => setFormData(p => ({...p, hora_lembrete: e.target.value}))} /></div>
                            </div>
                            <div>
                                <Label className="flex items-center gap-1 mb-2"><Palette className="h-3.5 w-3.5" />Cor</Label>
                                <div className="flex gap-2">
                                    {CORES.map(c => (
                                        <button key={c} type="button" className={`w-7 h-7 rounded-full transition-all ${formData.cor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} onClick={() => setFormData(p => ({...p, cor: c}))} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting} data-testid="save-anotacao-btn">{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? 'Atualizar' : 'Criar'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : anotacoes.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><StickyNote className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Nenhuma anotacao. Crie lembretes pessoais!</p></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {anotacoes.map(a => (
                        <Card key={a.id} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`anotacao-card-${a.id}`}>
                            <div className="h-1.5" style={{ backgroundColor: a.cor || '#6366f1' }} />
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-slate-800 text-sm">{a.titulo}</h3>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                                {a.conteudo && <p className="text-sm text-slate-600 line-clamp-4 mb-3">{a.conteudo}</p>}
                                {(a.data_lembrete || a.hora_lembrete) && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
                                        <Clock className="h-3 w-3" />
                                        {a.data_lembrete && <span>{a.data_lembrete}</span>}
                                        {a.hora_lembrete && <span>{a.hora_lembrete}</span>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
