import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinResumo() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const r = await churchAPI.getFinResumo(); setData(r.data); }
            catch { toast.error('Erro ao carregar resumo'); }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!data) return null;

    const maxFlow = Math.max(...(data.fluxo_mensal || []).map(f => Math.max(f.receitas, f.despesas)), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-resumo-title">Resumo Financeiro</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <Wallet className="w-6 h-6 mx-auto mb-1 text-brand-sky" />
                    <p className="text-xl font-bold text-slate-900">{fmt(data.saldo_total)}</p>
                    <p className="text-xs text-slate-500">Saldo Total</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <ArrowUpRight className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold text-green-600">{fmt(data.receitas_mes)}</p>
                    <p className="text-xs text-slate-500">Receitas (Mes)</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <ArrowDownRight className="w-6 h-6 mx-auto mb-1 text-red-500" />
                    <p className="text-xl font-bold text-red-600">{fmt(data.despesas_mes)}</p>
                    <p className="text-xs text-slate-500">Despesas (Mes)</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className={`text-xl font-bold ${data.resultado_mes >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(data.resultado_mes)}</p>
                    <p className="text-xs text-slate-500">Resultado (Mes)</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-xl font-bold text-slate-900">{fmt(data.total_receitas - data.total_despesas)}</p>
                    <p className="text-xs text-slate-500">Resultado Geral</p>
                </CardContent></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="dashboard-card" data-testid="chart-contas">
                    <CardHeader><CardTitle className="font-heading">Saldo por Conta</CardTitle></CardHeader>
                    <CardContent>
                        {data.contas?.length > 0 ? (
                            <div className="space-y-3">
                                {data.contas.map(c => (
                                    <div key={c.nome} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                        <span className="font-medium text-slate-700">{c.nome}</span>
                                        <span className={`font-bold ${c.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(c.saldo)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Nenhuma conta</p>}
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="chart-categorias">
                    <CardHeader><CardTitle className="font-heading">Por Categoria</CardTitle></CardHeader>
                    <CardContent>
                        {data.por_categoria?.length > 0 ? (
                            <div className="space-y-3">
                                {data.por_categoria.map(c => (
                                    <div key={c.nome}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />
                                                <span className="text-slate-700">{c.nome}</span>
                                            </span>
                                            <span className="text-slate-500">R: {fmt(c.receita)} | D: {fmt(c.despesa)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                    </CardContent>
                </Card>
            </div>

            <Card className="dashboard-card" data-testid="chart-fluxo">
                <CardHeader><CardTitle className="font-heading">Fluxo de Caixa (6 meses)</CardTitle></CardHeader>
                <CardContent>
                    {data.fluxo_mensal?.length > 0 ? (
                        <div className="space-y-3">
                            {data.fluxo_mensal.map(f => (
                                <div key={f.mes} className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">{f.mes}</p>
                                    <div className="flex gap-2 items-center">
                                        <div className="h-4 bg-green-400 rounded" style={{ width: `${(f.receitas / maxFlow) * 100}%`, minWidth: 4 }} />
                                        <span className="text-xs text-green-600">{fmt(f.receitas)}</span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="h-4 bg-red-400 rounded" style={{ width: `${(f.despesas / maxFlow) * 100}%`, minWidth: 4 }} />
                                        <span className="text-xs text-red-600">{fmt(f.despesas)}</span>
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
