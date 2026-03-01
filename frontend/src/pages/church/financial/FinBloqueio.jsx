import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, Lock, Unlock, Plus } from 'lucide-react';
import { toast } from 'sonner';

const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function FinBloqueio() {
    const [periodos, setPeriodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const now = new Date();
    const [ano, setAno] = useState(now.getFullYear());
    const [mes, setMes] = useState(now.getMonth() + 1);

    const fetchData = async () => {
        try { const r = await churchAPI.getFinPeriodosBloqueados(); setPeriodos(r.data || []); }
        catch { toast.error('Erro'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleBlock = async () => {
        setSubmitting(true);
        try { await churchAPI.createFinPeriodoBloqueado({ ano: parseInt(ano), mes: parseInt(mes) }); toast.success('Periodo bloqueado!'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.detail || 'Erro'); }
        finally { setSubmitting(false); }
    };

    const handleUnblock = async (pb) => {
        if (!window.confirm(`Desbloquear ${meses[pb.mes - 1]} ${pb.ano}?`)) return;
        try { await churchAPI.deleteFinPeriodoBloqueado(pb.id); toast.success('Desbloqueado!'); fetchData(); }
        catch { toast.error('Erro'); }
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-bloqueio-title">Bloqueio de Periodos</h1>
                <p className="text-slate-500">Bloqueie meses para impedir alteracoes retroativas</p>
            </div>

            <Card className="dashboard-card">
                <CardHeader><CardTitle className="font-heading">Bloquear Periodo</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="space-y-2 flex-1">
                            <Label>Ano</Label>
                            <Input type="number" min="2020" max="2030" value={ano} onChange={(e) => setAno(e.target.value)} data-testid="bloqueio-ano" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label>Mes</Label>
                            <Input type="number" min="1" max="12" value={mes} onChange={(e) => setMes(e.target.value)} data-testid="bloqueio-mes" />
                        </div>
                        <Button onClick={handleBlock} disabled={submitting} className="bg-slate-900 hover:bg-slate-800" data-testid="bloquear-btn">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" /> Bloquear</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="dashboard-card" data-testid="periodos-bloqueados-list">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Lock className="w-5 h-5" /> Periodos Bloqueados ({periodos.length})</CardTitle></CardHeader>
                <CardContent>
                    {periodos.length > 0 ? (
                        <div className="space-y-2">
                            {periodos.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <p className="font-medium text-slate-900">{meses[p.mes - 1]} {p.ano}</p>
                                            {p.bloqueado_por && <p className="text-xs text-slate-400">Por: {p.bloqueado_por}</p>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleUnblock(p)} className="text-red-500" data-testid={`unblock-${p.id}`}>
                                        <Unlock className="w-4 h-4 mr-1" /> Desbloquear
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-8 text-slate-400">Nenhum periodo bloqueado</p>}
                </CardContent>
            </Card>
        </div>
    );
}
