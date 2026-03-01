import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinPainelEstrategico() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const r = await churchAPI.getFinPainelEstrategico(); setData(r.data); }
            catch { toast.error('Erro ao carregar'); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!data) return null;

    const saudeColors = { positiva: 'bg-green-100 text-green-700', negativa: 'bg-red-100 text-red-700', equilibrada: 'bg-blue-100 text-blue-700' };
    const maxComp = Math.max(...(data.comparativo_mensal || []).map(c => Math.max(c.receitas, c.despesas)), 1);
    const maxDesp = Math.max(...(data.top_despesas || []).map(d => d.valor), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-painel-title">Painel Financeiro Estrategico</h1>
                <p className="text-slate-500">Visao estrategica e indicadores de saude financeira</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold text-green-600">{fmt(data.receita_anual)}</p>
                    <p className="text-xs text-slate-500">Receita Anual</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <TrendingDown className="w-6 h-6 mx-auto mb-1 text-red-500" />
                    <p className="text-xl font-bold text-red-600">{fmt(data.despesa_anual)}</p>
                    <p className="text-xs text-slate-500">Despesa Anual</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className={`text-xl font-bold ${data.resultado_anual >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(data.resultado_anual)}</p>
                    <p className="text-xs text-slate-500">Resultado Anual</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <Activity className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                    <Badge className={saudeColors[data.saude_financeira] || 'bg-slate-100 text-slate-600'}>
                        {data.saude_financeira?.charAt(0).toUpperCase() + data.saude_financeira?.slice(1)}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">Saude Financeira</p>
                </CardContent></Card>
            </div>

            <Card className="dashboard-card" data-testid="chart-comparativo">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Comparativo Mensal (12 meses)</CardTitle></CardHeader>
                <CardContent>
                    {data.comparativo_mensal?.length > 0 ? (
                        <div className="space-y-3">
                            {data.comparativo_mensal.map(c => (
                                <div key={c.mes} className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">{c.mes}</p>
                                    <div className="flex gap-2 items-center">
                                        <div className="h-3 bg-green-400 rounded" style={{ width: `${(c.receitas / maxComp) * 100}%`, minWidth: 2 }} />
                                        <span className="text-xs text-green-600 whitespace-nowrap">{fmt(c.receitas)}</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="h-3 bg-red-400 rounded" style={{ width: `${(c.despesas / maxComp) * 100}%`, minWidth: 2 }} />
                                        <span className="text-xs text-red-600 whitespace-nowrap">{fmt(c.despesas)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                </CardContent>
            </Card>

            <Card className="dashboard-card" data-testid="chart-top-despesas">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><TrendingDown className="w-5 h-5" /> Ranking Maiores Despesas por Categoria</CardTitle></CardHeader>
                <CardContent>
                    {data.top_despesas?.length > 0 ? (
                        <div className="space-y-3">
                            {data.top_despesas.map((d, i) => (
                                <div key={d.nome}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                                            <span className="text-slate-700">{d.nome}</span>
                                        </span>
                                        <span className="font-bold text-red-600">{fmt(d.valor)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full" style={{ width: `${(d.valor / maxDesp) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                </CardContent>
            </Card>
        </div>
    );
}
