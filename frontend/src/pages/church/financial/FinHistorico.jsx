import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Loader2, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function FinHistorico() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const r = await churchAPI.getFinLogs(); setLogs(r.data || []); }
            catch { toast.error('Erro'); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    const acaoColors = {
        criar_transacao: 'bg-green-100 text-green-700',
        atualizar_transacao: 'bg-blue-100 text-blue-700',
        excluir_transacao: 'bg-red-100 text-red-700',
        criar_conta: 'bg-green-100 text-green-700',
        atualizar_conta: 'bg-blue-100 text-blue-700',
        excluir_conta: 'bg-red-100 text-red-700',
        bloquear_periodo: 'bg-amber-100 text-amber-700',
        desbloquear_periodo: 'bg-purple-100 text-purple-700',
        importar_transacoes: 'bg-teal-100 text-teal-700',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-historico-title">Historico de Acoes</h1>
                <p className="text-slate-500">Registro de auditoria do modulo financeiro</p>
            </div>

            <Card className="dashboard-card" data-testid="logs-list">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Shield className="w-5 h-5" /> Logs ({logs.length})</CardTitle></CardHeader>
                <CardContent>
                    {logs.length > 0 ? (
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <Clock className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={acaoColors[log.acao] || 'bg-slate-100 text-slate-600'}>{log.acao?.replace(/_/g, ' ')}</Badge>
                                            <span className="text-xs text-slate-400">{log.data_hora?.replace('T', ' ').substring(0, 19)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">Usuario: <span className="font-medium">{log.usuario}</span></p>
                                        {log.transacao_id && <p className="text-xs text-slate-400">Transacao: {log.transacao_id.substring(0, 8)}...</p>}
                                        {log.dados_depois && <p className="text-xs text-slate-400 mt-1">Dados: {JSON.stringify(log.dados_depois)}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-8 text-slate-400">Nenhum registro de auditoria</p>}
                </CardContent>
            </Card>
        </div>
    );
}
