import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    LifeBuoy,
    MessageSquare,
    BookOpen,
    PlayCircle,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tickets');
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        categoria: 'suporte_tecnico',
        prioridade: 'media'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsRes, dashRes] = await Promise.all([
                churchAPI.getTickets(),
                churchAPI.getSupportDashboard()
            ]);
            setTickets(ticketsRes.data);
            setDashboard(dashRes.data);
        } catch (error) {
            console.error('Error fetching support data:', error);
            toast.error('Erro ao carregar dados de suporte');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await churchAPI.createTicket(formData);
            toast.success('Ticket aberto com sucesso!');
            setDialogOpen(false);
            setFormData({ titulo: '', descricao: '', categoria: 'suporte_tecnico', prioridade: 'media' });
            fetchData();
        } catch (error) {
            toast.error('Erro ao abrir ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors = {
        aberto: 'bg-blue-100 text-blue-800',
        em_andamento: 'bg-yellow-100 text-yellow-800',
        aguardando: 'bg-purple-100 text-purple-800',
        resolvido: 'bg-green-100 text-green-800',
        fechado: 'bg-slate-100 text-slate-800'
    };

    const priorityColors = {
        baixa: 'text-slate-500',
        media: 'text-blue-500',
        alta: 'text-orange-500',
        critica: 'text-red-500 font-bold'
    };

    if (loading && !tickets.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Suporte e Ajuda</h1>
                    <p className="text-slate-500">Central de atendimento e base de conhecimento</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800">
                                <Plus className="w-4 h-4 mr-2" />
                                Abrir Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Chamado de Suporte</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="titulo">Assunto *</Label>
                                    <Input 
                                        id="titulo" 
                                        value={formData.titulo} 
                                        onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="descricao">Descrição detalhada *</Label>
                                    <textarea 
                                        id="descricao" 
                                        className="w-full min-h-[100px] p-2 border rounded-md"
                                        value={formData.descricao} 
                                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="suporte_tecnico">Suporte Técnico</SelectItem>
                                                <SelectItem value="financeiro">Financeiro</SelectItem>
                                                <SelectItem value="treinamento">Treinamento</SelectItem>
                                                <SelectItem value="sugestao">Sugestão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Select value={formData.prioridade} onValueChange={(v) => setFormData({...formData, prioridade: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="baixa">Baixa</SelectItem>
                                                <SelectItem value="media">Média</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                                <SelectItem value="critica">Crítica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? 'Enviando...' : 'Abrir Chamado'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex gap-4 border-b">
                <button 
                    className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'tickets' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('tickets')}
                >
                    Meus Tickets
                </button>
                <button 
                    className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'tutorials' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('tutorials')}
                >
                    Tutoriais e Ajuda
                </button>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-slate-500">Tickets Abertos</p>
                                <h3 className="text-2xl font-bold">{dashboard?.by_status?.find(s => s._id === 'aberto')?.count || 0}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-slate-500">Em Andamento</p>
                                <h3 className="text-2xl font-bold">{dashboard?.by_status?.find(s => s._id === 'em_andamento')?.count || 0}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-slate-500">Resolvidos (30d)</p>
                                <h3 className="text-2xl font-bold">{dashboard?.resolved_last_30_days || 0}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium text-slate-500">Cumprimento SLA</p>
                                <h3 className="text-2xl font-bold text-green-600">98%</h3>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : activeTab === 'tickets' ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[ticket.status]}`}>
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{ticket.titulo}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span>#{ticket.id.slice(0, 8)}</span>
                                                <span>•</span>
                                                <span className={`capitalize ${priorityColors[ticket.prioridade]}`}>{ticket.prioridade}</span>
                                                <span>•</span>
                                                <span>Aberto em {formatDate(ticket.data_abertura)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={statusColors[ticket.status]}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                        <Button variant="ghost" size="sm">Ver Detalhes</Button>
                                    </div>
                                </div>
                            ))}
                            {tickets.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    Você não possui nenhum ticket aberto.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <PlayCircle className="w-10 h-10 text-blue-500 mb-2" />
                            <CardTitle>Primeiros Passos</CardTitle>
                            <p className="text-sm text-slate-500">Aprenda a configurar sua igreja no sistema em menos de 10 minutos.</p>
                        </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <BookOpen className="w-10 h-10 text-green-500 mb-2" />
                            <CardTitle>Gestão Financeira</CardTitle>
                            <p className="text-sm text-slate-500">Como registrar entradas, saídas e gerar relatórios completos.</p>
                        </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <LifeBuoy className="w-10 h-10 text-purple-500 mb-2" />
                            <CardTitle>Base de Conhecimento</CardTitle>
                            <p className="text-sm text-slate-500">Pesquise por dúvidas frequentes e resolva problemas rapidamente.</p>
                        </CardHeader>
                    </Card>
                </div>
            )}
        </div>
    );
}
