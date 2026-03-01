import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Plus, Search, MoreVertical, Calendar, MapPin, Users, Loader2, Edit, Trash2, DollarSign, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
    title: '', description: '', category: '', event_type: 'gratuito', event_date: '', event_date_end: '',
    event_time: '', location: '', max_capacity: '', is_paid: false, price: 0,
    department_id: '', group_id: '', responsavel_id: '', status: 'active', image_url: '',
    conta_financeira_id: '', categoria_financeira_id: '', centro_custo_id: '',
};

export default function EventosPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [members, setMembers] = useState([]);
    const [finContas, setFinContas] = useState([]);
    const [finCategorias, setFinCategorias] = useState([]);
    const [finCentros, setFinCentros] = useState([]);
    const [tab, setTab] = useState('all');
    // Inscricoes
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [inscricoes, setInscricoes] = useState([]);
    const [inscDialogOpen, setInscDialogOpen] = useState(false);
    const [inscMemberId, setInscMemberId] = useState('');

    useEffect(() => { fetchEvents(); fetchLookups(); }, []);

    const fetchLookups = async () => {
        try {
            const [d, g, m, fc, fcat, fcc] = await Promise.all([
                churchAPI.getDepartments(), churchAPI.getGroups(), churchAPI.getMembers({ per_page: 500 }),
                churchAPI.getFinContas().catch(() => ({ data: [] })),
                churchAPI.getFinCategorias({ tipo: 'receita' }).catch(() => ({ data: [] })),
                churchAPI.getFinCentrosCusto().catch(() => ({ data: [] })),
            ]);
            setDepartments(d.data || []); setGroups(g.data || []);
            setMembers((m.data?.items || m.data || []));
            setFinContas(fc.data || []); setFinCategorias(fcat.data || []); setFinCentros(fcc.data || []);
        } catch {}
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const r = await churchAPI.getEvents({ search: searchQuery || undefined });
            setEvents(r.data || []);
        } catch { toast.error('Erro ao carregar eventos'); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.event_date) return toast.error('Titulo e data sao obrigatorios');
        setSubmitting(true);
        try {
            const payload = { ...formData, max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null, price: parseFloat(formData.price) || 0, is_paid: formData.event_type === 'pago' };
            if (editingEvent) {
                await churchAPI.updateEvent(editingEvent.id, payload);
                toast.success('Evento atualizado');
            } else {
                await churchAPI.createEvent(payload);
                toast.success('Evento criado');
            }
            setDialogOpen(false); setEditingEvent(null); setFormData({ ...EMPTY_FORM }); fetchEvents();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro ao salvar evento'); }
        setSubmitting(false);
    };

    const handleEdit = (ev) => {
        setEditingEvent(ev);
        setFormData({ ...EMPTY_FORM, ...ev, max_capacity: ev.max_capacity || '', price: ev.price || 0, event_type: ev.is_paid ? 'pago' : 'gratuito' });
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remover este evento?')) return;
        try { await churchAPI.deleteEvent(id); toast.success('Evento removido'); fetchEvents(); }
        catch { toast.error('Erro ao remover'); }
    };

    const openInscricoes = async (ev) => {
        setSelectedEvent(ev);
        try { const r = await churchAPI.getEventInscricoes(ev.id); setInscricoes(r.data || []); }
        catch { toast.error('Erro ao carregar inscricoes'); setInscricoes([]); }
    };

    const addInscricao = async () => {
        if (!inscMemberId) return toast.error('Selecione um membro');
        try {
            await churchAPI.createEventInscricao(selectedEvent.id, { membro_id: inscMemberId, status_pagamento: selectedEvent.is_paid ? 'pendente' : 'confirmado' });
            toast.success('Inscricao realizada');
            setInscMemberId('');
            const r = await churchAPI.getEventInscricoes(selectedEvent.id); setInscricoes(r.data || []);
            fetchEvents();
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro na inscricao'); }
    };

    const confirmarPgto = async (inscId) => {
        try {
            await churchAPI.confirmarPagamentoInscricao(selectedEvent.id, inscId);
            toast.success('Pagamento confirmado');
            const r = await churchAPI.getEventInscricoes(selectedEvent.id); setInscricoes(r.data || []);
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
    };

    const cancelarInsc = async (inscId) => {
        if (!window.confirm('Cancelar inscricao? Se pago, sera estornado.')) return;
        try {
            await churchAPI.deleteEventInscricao(selectedEvent.id, inscId);
            toast.success('Inscricao cancelada');
            const r = await churchAPI.getEventInscricoes(selectedEvent.id); setInscricoes(r.data || []);
            fetchEvents();
        } catch { toast.error('Erro'); }
    };

    const filteredEvents = events.filter(e => tab === 'all' || e.status === tab);
    const statusColor = (s) => s === 'active' ? 'bg-green-100 text-green-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';

    return (
        <div className="space-y-6" data-testid="eventos-page">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-800">Eventos</h1><p className="text-sm text-slate-500">Gerencie eventos gratuitos e pagos</p></div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingEvent(null); setFormData({ ...EMPTY_FORM }); } }}>
                    <DialogTrigger asChild><Button data-testid="add-event-btn"><Plus className="h-4 w-4 mr-2" />Novo Evento</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2"><Label>Titulo *</Label><Input value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} required data-testid="event-title-input" /></div>
                                <div className="sm:col-span-2"><Label>Descricao</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2} /></div>
                                <div><Label>Tipo</Label>
                                    <Select value={formData.event_type} onValueChange={v => setFormData(p => ({...p, event_type: v, is_paid: v === 'pago'}))}>
                                        <SelectTrigger data-testid="event-type-select"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="gratuito">Gratuito</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Categoria</Label><Input value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))} placeholder="Ex: Conferencia, Workshop" /></div>
                                <div><Label>Data Inicio *</Label><Input type="date" value={formData.event_date} onChange={e => setFormData(p => ({...p, event_date: e.target.value}))} required data-testid="event-date-input" /></div>
                                <div><Label>Data Fim</Label><Input type="date" value={formData.event_date_end} onChange={e => setFormData(p => ({...p, event_date_end: e.target.value}))} /></div>
                                <div><Label>Horario</Label><Input type="time" value={formData.event_time} onChange={e => setFormData(p => ({...p, event_time: e.target.value}))} /></div>
                                <div><Label>Local</Label><Input value={formData.location} onChange={e => setFormData(p => ({...p, location: e.target.value}))} /></div>
                                <div><Label>Limite de Participantes</Label><Input type="number" value={formData.max_capacity} onChange={e => setFormData(p => ({...p, max_capacity: e.target.value}))} /></div>
                                <div><Label>Departamento</Label>
                                    <Select value={formData.department_id || '_none_'} onValueChange={v => setFormData(p => ({...p, department_id: v === '_none_' ? '' : v}))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent><SelectItem value="_none_">Nenhum</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Grupo</Label>
                                    <Select value={formData.group_id || '_none_'} onValueChange={v => setFormData(p => ({...p, group_id: v === '_none_' ? '' : v}))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent><SelectItem value="_none_">Nenhum</SelectItem>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Responsavel</Label>
                                    <Select value={formData.responsavel_id || '_none_'} onValueChange={v => setFormData(p => ({...p, responsavel_id: v === '_none_' ? '' : v}))}>
                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent><SelectItem value="_none_">Nenhum</SelectItem>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Status</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData(p => ({...p, status: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="finished">Encerrado</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {formData.event_type === 'pago' && (
                                <Card className="border-amber-200 bg-amber-50/50">
                                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Dados Financeiros</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} data-testid="event-price-input" /></div>
                                        <div><Label>Conta Financeira</Label>
                                            <Select value={formData.conta_financeira_id || '_none_'} onValueChange={v => setFormData(p => ({...p, conta_financeira_id: v === '_none_' ? '' : v}))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="_none_">Nenhuma</SelectItem>{finContas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div><Label>Categoria Financeira</Label>
                                            <Select value={formData.categoria_financeira_id || '_none_'} onValueChange={v => setFormData(p => ({...p, categoria_financeira_id: v === '_none_' ? '' : v}))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="_none_">Nenhuma</SelectItem>{finCategorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div><Label>Centro de Custo</Label>
                                            <Select value={formData.centro_custo_id || '_none_'} onValueChange={v => setFormData(p => ({...p, centro_custo_id: v === '_none_' ? '' : v}))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent><SelectItem value="_none_">Nenhum</SelectItem>{finCentros.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={submitting} data-testid="save-event-btn">{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingEvent ? 'Atualizar' : 'Criar Evento'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Buscar eventos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchEvents()} data-testid="search-events" />
                </div>
                <Tabs value={tab} onValueChange={setTab} className="flex-shrink-0">
                    <TabsList><TabsTrigger value="all">Todos</TabsTrigger><TabsTrigger value="active">Ativos</TabsTrigger><TabsTrigger value="finished">Encerrados</TabsTrigger><TabsTrigger value="cancelled">Cancelados</TabsTrigger></TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : filteredEvents.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Nenhum evento encontrado</p></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map(ev => (
                        <Card key={ev.id} className="hover:shadow-md transition-shadow" data-testid={`event-card-${ev.id}`}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-800 truncate">{ev.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={`text-xs ${statusColor(ev.status)}`}>{ev.status === 'active' ? 'Ativo' : ev.status === 'finished' ? 'Encerrado' : 'Cancelado'}</Badge>
                                            {ev.is_paid && <Badge className="bg-amber-100 text-amber-700 text-xs">Pago - R$ {(ev.price || 0).toFixed(2)}</Badge>}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(ev)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openInscricoes(ev)}><Users className="h-4 w-4 mr-2" />Inscricoes</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(ev.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Remover</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-1.5 text-sm text-slate-600">
                                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{ev.event_date}{ev.event_time && ` as ${ev.event_time}`}</div>
                                    {ev.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{ev.location}</div>}
                                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{ev.inscricoes_count || 0} inscritos{ev.max_capacity ? ` / ${ev.max_capacity} vagas` : ''}</div>
                                    {ev.department_name && <Badge variant="outline" className="text-xs">{ev.department_name}</Badge>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Inscricoes Panel */}
            <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Inscricoes - {selectedEvent?.title}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Select value={inscMemberId} onValueChange={setInscMemberId}>
                                <SelectTrigger className="flex-1" data-testid="insc-member-select"><SelectValue placeholder="Selecione membro" /></SelectTrigger>
                                <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button onClick={addInscricao} data-testid="add-inscricao-btn"><UserPlus className="h-4 w-4 mr-1" />Inscrever</Button>
                        </div>
                        {inscricoes.length === 0 ? (
                            <p className="text-center text-slate-400 py-4">Nenhuma inscricao</p>
                        ) : (
                            <div className="space-y-2">
                                {inscricoes.map(ins => (
                                    <div key={ins.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`inscricao-${ins.id}`}>
                                        <div>
                                            <p className="font-medium text-sm">{ins.membro_nome || ins.membro_id}</p>
                                            <p className="text-xs text-slate-500">{ins.data_inscricao?.slice(0, 10)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedEvent?.is_paid && (
                                                <Badge className={ins.status_pagamento === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                                    {ins.status_pagamento === 'confirmado' ? 'Pago' : 'Pendente'}
                                                </Badge>
                                            )}
                                            {selectedEvent?.is_paid && ins.status_pagamento !== 'confirmado' && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => confirmarPgto(ins.id)} title="Confirmar pagamento"><CheckCircle className="h-4 w-4" /></Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => cancelarInsc(ins.id)} title="Cancelar"><XCircle className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
