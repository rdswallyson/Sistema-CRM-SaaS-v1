import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Plus,
    Search,
    MoreVertical,
    Calendar,
    MapPin,
    Users,
    QrCode,
    Loader2,
    Edit,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        max_capacity: '',
        is_paid: false,
        price: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await churchAPI.getEvents();
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const eventData = {
                ...formData,
                max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
                price: formData.is_paid ? parseFloat(formData.price) : 0,
            };

            if (editingEvent) {
                await churchAPI.updateEvent(editingEvent.id, eventData);
                toast.success('Evento atualizado com sucesso!');
            } else {
                await churchAPI.createEvent(eventData);
                toast.success('Evento criado com sucesso!');
            }

            setDialogOpen(false);
            resetForm();
            fetchEvents();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao salvar evento';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            event_date: event.event_date || '',
            event_time: event.event_time || '',
            location: event.location || '',
            max_capacity: event.max_capacity ? String(event.max_capacity) : '',
            is_paid: event.is_paid || false,
            price: event.price || 0,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (event) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${event.title}"?`)) return;
        try {
            await churchAPI.deleteEvent(event.id);
            toast.success('Evento excluido com sucesso');
            fetchEvents();
        } catch (error) {
            toast.error('Erro ao excluir evento');
        }
    };

    const resetForm = () => {
        setEditingEvent(null);
        setFormData({
            title: '',
            description: '',
            event_date: '',
            event_time: '',
            location: '',
            max_capacity: '',
            is_paid: false,
            price: 0,
        });
    };

    const filteredEvents = events.filter((e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPastEvent = (date) => new Date(date) < new Date();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Eventos</h1>
                    <p className="text-slate-500">Gerencie os eventos da sua igreja</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-event-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Evento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">
                                {editingEvent ? 'Editar Evento' : 'Criar Evento'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titulo do Evento *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Culto de Celebracao"
                                    required
                                    data-testid="event-title-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descricao</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descricao do evento..."
                                    className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    data-testid="event-description-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event_date">Data *</Label>
                                    <Input
                                        id="event_date"
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        required
                                        data-testid="event-date-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="event_time">Horario</Label>
                                    <Input
                                        id="event_time"
                                        type="time"
                                        value={formData.event_time}
                                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                        data-testid="event-time-input"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Local</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ex: Templo Principal"
                                    data-testid="event-location-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_capacity">Vagas (deixe vazio para ilimitado)</Label>
                                <Input
                                    id="max_capacity"
                                    type="number"
                                    value={formData.max_capacity}
                                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                                    placeholder="100"
                                    data-testid="event-capacity-input"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <Label htmlFor="is_paid" className="cursor-pointer">Evento Pago</Label>
                                    <p className="text-xs text-slate-500">Cobra inscricao dos participantes</p>
                                </div>
                                <Switch
                                    id="is_paid"
                                    checked={formData.is_paid}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                                    data-testid="event-paid-switch"
                                />
                            </div>
                            {formData.is_paid && (
                                <div className="space-y-2">
                                    <Label htmlFor="price">Valor (R$)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="50.00"
                                        data-testid="event-price-input"
                                    />
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="save-event-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {editingEvent ? 'Salvando...' : 'Criando...'}
                                    </>
                                ) : (
                                    editingEvent ? 'Salvar Alteracoes' : 'Criar Evento'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar evento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="search-events-input"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Events Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="events-grid">
                    {filteredEvents.map((event) => (
                        <Card
                            key={event.id}
                            className={`dashboard-card card-hover ${isPastEvent(event.event_date) ? 'opacity-60' : ''}`}
                            data-testid={`event-${event.id}`}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <Badge
                                        className={
                                            isPastEvent(event.event_date)
                                                ? 'bg-slate-100 text-slate-500'
                                                : 'bg-brand-sky/10 text-brand-sky-active'
                                        }
                                    >
                                        {isPastEvent(event.event_date) ? 'Encerrado' : 'Proximo'}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" data-testid={`event-menu-${event.id}`}>
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(event)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(event)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="font-heading text-xl mt-4">{event.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {event.description && (
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{event.description}</p>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">
                                            {formatDate(event.event_date)}
                                            {event.event_time && ` as ${event.event_time}`}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-600">{event.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-600">
                                            {event.checked_in_count || 0} check-ins
                                            {event.max_capacity && ` / ${event.max_capacity} vagas`}
                                        </span>
                                    </div>
                                </div>
                                {event.is_paid && (
                                    <div className="mt-3">
                                        <Badge className="bg-amber-100 text-amber-700">
                                            {formatCurrency(event.price)}
                                        </Badge>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" data-testid={`checkin-btn-${event.id}`}>
                                        <QrCode className="w-4 h-4 mr-1" />
                                        Check-in
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredEvents.length === 0 && (
                        <Card className="dashboard-card col-span-full">
                            <CardContent className="py-8 text-center">
                                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Nenhum evento encontrado</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
