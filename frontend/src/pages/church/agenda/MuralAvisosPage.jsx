import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Plus, MoreVertical, Megaphone, Pin, Loader2, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const PRIORIDADE_COLORS = { baixa: 'bg-slate-100 text-slate-600', normal: 'bg-blue-100 text-blue-700', alta: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700' };
const EMPTY_FORM = { titulo: '', conteudo: '', departamento_id: '', grupo_id: '', data_validade: '', prioridade: 'normal', anexo: '', fixado: false, data_publicacao: '', status: 'publicado' };

export default function MuralAvisosPage() {
    const [avisos, setAvisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [groups, setGroups] = useState([]);

    useEffect(() => { fetchAvisos(); fetchLookups(); }, []);

    const fetchLookups = async () => {
        try {
            const [d, g] = await Promise.all([churchAPI.getDepartments(), churchAPI.getGroups()]);
            setDepartments(d.data || []); setGroups(g.data || []);
        } catch {}
    };

    const fetchAvisos = async () => {
        setLoading(true);
        try { const r = await churchAPI.getAvisos(); setAvisos(r.data || []); }
        catch { toast.error('Erro ao carregar avisos'); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.conteudo) return toast.error('Titulo e conteudo sao obrigatorios');
        setSubmitting(true);
        try {
            if (editing) { await churchAPI.updateAviso(editing.id, formData); toast.success('Aviso atualizado'); }
            else { await churchAPI.createAviso(formData); toast.success('Aviso criado'); }
            setDialogOpen(false); setEditing(null); setFormData({ ...EMPTY_FORM }); fetchAvisos();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar'); }
        setSubmitting(false);
    };

    const handleEdit = (av) => { setEditing(av); setFormData({ ...EMPTY_FORM, ...av }); setDialogOpen(true); };
    const handleDelete = async (id) => { if (!window.confirm('Remover aviso?')) return; try { await churchAPI.deleteAviso(id); toast.success('Removido'); fetchAvisos(); } catch { toast.error('Erro'); } };
    const toggleFixar = async (av) => { try { await churchAPI.updateAviso(av.id, { fixado: !av.fixado }); fetchAvisos(); } catch {} };

    return (
        <div className="space-y-6" data-testid="mural-avisos-page">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-800">Mural de Avisos</h1><p className="text-sm text-slate-500">Comunique avisos importantes para a igreja</p></div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setFormData({ ...EMPTY_FORM }); } }}>
                    <DialogTrigger asChild><Button data-testid="add-aviso-btn"><Plus className="h-4 w-4 mr-2" />Novo Aviso</Button></DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{editing ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><Label>Titulo *</Label><Input value={formData.titulo} onChange={e => setFormData(p => ({...p, titulo: e.target.value}))} required data-testid="aviso-titulo-input" /></div>
                            <div><Label>Conteudo *</Label><Textarea value={formData.conteudo} onChange={e => setFormData(p => ({...p, conteudo: e.target.value}))} rows={4} required data-testid="aviso-conteudo-input" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Prioridade</Label>
                                    <Select value={formData.prioridade} onValueChange={v => setFormData(p => ({...p, prioridade: v}))}>
                                        <SelectTrigger data-testid="aviso-prioridade"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Status</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData(p => ({...p, status: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="agendado">Agendado</SelectItem><SelectItem value="publicado">Publicado</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Data Validade</Label><Input type="date" value={formData.data_validade} onChange={e => setFormData(p => ({...p, data_validade: e.target.value}))} /></div>
                                <div><Label>Publicacao Agendada</Label><Input type="date" value={formData.data_publicacao} onChange={e => setFormData(p => ({...p, data_publicacao: e.target.value}))} /></div>
                                <div><Label>Departamento Alvo</Label>
                                    <Select value={formData.departamento_id} onValueChange={v => setFormData(p => ({...p, departamento_id: v}))}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent><SelectItem value="">Todos</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Grupo Alvo</Label>
                                    <Select value={formData.grupo_id} onValueChange={v => setFormData(p => ({...p, grupo_id: v}))}>
                                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                        <SelectContent><SelectItem value="">Todos</SelectItem>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={formData.fixado} onCheckedChange={v => setFormData(p => ({...p, fixado: v}))} /><Label>Fixar no topo</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting} data-testid="save-aviso-btn">{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? 'Atualizar' : 'Publicar'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : avisos.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Nenhum aviso publicado</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {avisos.map(av => (
                        <Card key={av.id} className={`hover:shadow-md transition-shadow ${av.fixado ? 'border-amber-300 bg-amber-50/30' : ''}`} data-testid={`aviso-card-${av.id}`}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {av.fixado && <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />}
                                            {av.prioridade === 'urgente' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                            <h3 className="font-semibold text-slate-800">{av.titulo}</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">{av.conteudo}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={`text-xs ${PRIORIDADE_COLORS[av.prioridade]}`}>{av.prioridade}</Badge>
                                            {av.departamento_nome && <Badge variant="outline" className="text-xs">{av.departamento_nome}</Badge>}
                                            {av.grupo_nome && <Badge variant="outline" className="text-xs">{av.grupo_nome}</Badge>}
                                            {av.data_validade && <span className="text-xs text-slate-400">Valido ate: {av.data_validade}</span>}
                                            <span className="text-xs text-slate-400">{(av.created_at || '').slice(0, 10)}</span>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => toggleFixar(av)}><Pin className="h-4 w-4 mr-2" />{av.fixado ? 'Desfixar' : 'Fixar'}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(av)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(av.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Remover</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
