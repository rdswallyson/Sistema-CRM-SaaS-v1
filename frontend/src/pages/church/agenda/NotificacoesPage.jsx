import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Bell, Check, CheckCheck, Trash2, Loader2, Calendar, DollarSign, Megaphone, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

const TIPO_ICONS = {
    evento_novo: Calendar, pagamento_confirmado: DollarSign, evento_cancelado: AlertTriangle, aviso: Megaphone, alteracao: Info,
};
const TIPO_COLORS = {
    evento_novo: 'text-blue-500', pagamento_confirmado: 'text-green-500', evento_cancelado: 'text-red-500', aviso: 'text-amber-500', alteracao: 'text-slate-500',
};
const TIPO_LABELS = {
    evento_novo: 'Novo Evento', pagamento_confirmado: 'Pagamento', evento_cancelado: 'Cancelamento', aviso: 'Aviso', alteracao: 'Alteracao',
};

export default function NotificacoesPage() {
    const [notificacoes, setNotificacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => { fetchNotificacoes(); }, [filterTipo, filterStatus]);

    const fetchNotificacoes = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterTipo !== 'all') params.tipo = filterTipo;
            if (filterStatus !== 'all') params.status = filterStatus;
            const r = await churchAPI.getNotificacoes(params);
            setNotificacoes(r.data || []);
        } catch { toast.error('Erro ao carregar notificacoes'); }
        setLoading(false);
    };

    const marcarLida = async (id) => {
        try { await churchAPI.marcarNotificacaoLida(id); fetchNotificacoes(); }
        catch { toast.error('Erro'); }
    };

    const marcarTodasLidas = async () => {
        try { await churchAPI.marcarTodasLidas(); toast.success('Todas marcadas como lidas'); fetchNotificacoes(); }
        catch { toast.error('Erro'); }
    };

    const excluir = async (id) => {
        try { await churchAPI.deleteNotificacao(id); fetchNotificacoes(); }
        catch { toast.error('Erro'); }
    };

    const naoLidas = notificacoes.filter(n => n.status === 'nao_lida').length;

    return (
        <div className="space-y-6" data-testid="notificacoes-page">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Central de Notificacoes
                        {naoLidas > 0 && <Badge className="bg-red-500 text-white text-xs">{naoLidas}</Badge>}
                    </h1>
                    <p className="text-sm text-slate-500">Acompanhe todas as atualizacoes do sistema</p>
                </div>
                {naoLidas > 0 && (
                    <Button variant="outline" onClick={marcarTodasLidas} data-testid="mark-all-read-btn">
                        <CheckCheck className="h-4 w-4 mr-2" />Marcar todas como lidas
                    </Button>
                )}
            </div>

            <div className="flex gap-3">
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger className="w-[180px]" data-testid="filter-notif-tipo"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {Object.entries(TIPO_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="nao_lida">Nao lidas</SelectItem>
                        <SelectItem value="lida">Lidas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : notificacoes.length === 0 ? (
                <Card><CardContent className="py-16 text-center"><Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Nenhuma notificacao</p></CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {notificacoes.map(n => {
                        const Icon = TIPO_ICONS[n.tipo] || Info;
                        const colorClass = TIPO_COLORS[n.tipo] || 'text-slate-500';
                        return (
                            <div key={n.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${n.status === 'nao_lida' ? 'bg-blue-50/50 border-blue-200' : 'bg-white hover:bg-slate-50'}`} data-testid={`notif-${n.id}`}>
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${n.status === 'nao_lida' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                    <Icon className={`h-5 w-5 ${colorClass}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${n.status === 'nao_lida' ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{n.mensagem}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{TIPO_LABELS[n.tipo] || n.tipo}</Badge>
                                        <span className="text-xs text-slate-400">{(n.data_criacao || '').slice(0, 16).replace('T', ' ')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {n.status === 'nao_lida' && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => marcarLida(n.id)} title="Marcar como lida"><Check className="h-4 w-4" /></Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => excluir(n.id)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
