import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Loader2, Download, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinRelatorios() {
    const [data, setData] = useState(null);
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('fluxo');

    useEffect(() => {
        (async () => {
            try {
                const [rRes, tRes] = await Promise.all([churchAPI.getFinResumo(), churchAPI.getFinTransacoes()]);
                setData(rRes.data);
                setTxs(tRes.data || []);
            } catch { toast.error('Erro'); }
            finally { setLoading(false); }
        })();
    }, []);

    const exportCSV = () => {
        let csv = '';
        if (reportType === 'fluxo') {
            csv = 'Mes,Receitas,Despesas,Resultado\n';
            (data?.fluxo_mensal || []).forEach(f => { csv += `${f.mes},${f.receitas},${f.despesas},${f.receitas - f.despesas}\n`; });
        } else if (reportType === 'categoria') {
            csv = 'Categoria,Receitas,Despesas\n';
            (data?.por_categoria || []).forEach(c => { csv += `"${c.nome}",${c.receita || 0},${c.despesa || 0}\n`; });
        } else {
            csv = 'Data,Tipo,Valor,Descricao,Categoria,Conta,Status\n';
            txs.forEach(t => { csv += `${t.data},${t.tipo},${t.valor},"${t.descricao || ''}","${t.categoria_nome || ''}","${t.conta_nome || ''}",${t.status}\n`; });
        }
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Exportado!');
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    const receitas = txs.filter(t => t.tipo === 'receita' && t.status === 'confirmado');
    const despesas = txs.filter(t => t.tipo === 'despesa' && t.status === 'confirmado');
    const totalR = receitas.reduce((s, t) => s + t.valor, 0);
    const totalD = despesas.reduce((s, t) => s + t.valor, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-relatorios-title">Relatorios Financeiros</h1>
                <div className="flex gap-2">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fluxo">Fluxo de Caixa</SelectItem>
                            <SelectItem value="dre">DRE Simplificado</SelectItem>
                            <SelectItem value="categoria">Por Categoria</SelectItem>
                            <SelectItem value="completo">Todas Transacoes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportCSV} data-testid="export-relatorio-btn"><Download className="w-4 h-4 mr-2" /> CSV</Button>
                </div>
            </div>

            {reportType === 'dre' && (
                <Card className="dashboard-card" data-testid="dre-report"><CardHeader><CardTitle className="font-heading">DRE Simplificado</CardTitle></CardHeader><CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-green-50 rounded"><span className="text-green-700 font-medium">Total Receitas</span><span className="font-bold text-green-700">{fmt(totalR)}</span></div>
                        <div className="flex justify-between p-3 bg-red-50 rounded"><span className="text-red-700 font-medium">Total Despesas</span><span className="font-bold text-red-700">{fmt(totalD)}</span></div>
                        <div className={`flex justify-between p-3 rounded font-bold text-lg ${totalR - totalD >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <span>Resultado</span><span>{fmt(totalR - totalD)}</span>
                        </div>
                    </div>
                </CardContent></Card>
            )}

            {reportType === 'fluxo' && (
                <Card className="dashboard-card" data-testid="fluxo-report"><CardHeader><CardTitle className="font-heading">Fluxo de Caixa Mensal</CardTitle></CardHeader><CardContent>
                    {data?.fluxo_mensal?.length > 0 ? (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left py-2 px-3 text-sm">Mes</th><th className="text-right py-2 px-3 text-sm">Receitas</th><th className="text-right py-2 px-3 text-sm">Despesas</th><th className="text-right py-2 px-3 text-sm">Resultado</th></tr></thead>
                            <tbody>{data.fluxo_mensal.map(f => (<tr key={f.mes} className="border-b border-slate-50"><td className="py-2 px-3 text-sm">{f.mes}</td><td className="py-2 px-3 text-sm text-right text-green-600">{fmt(f.receitas)}</td><td className="py-2 px-3 text-sm text-right text-red-600">{fmt(f.despesas)}</td><td className={`py-2 px-3 text-sm text-right font-bold ${f.receitas - f.despesas >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(f.receitas - f.despesas)}</td></tr>))}</tbody></table></div>
                    ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                </CardContent></Card>
            )}

            {reportType === 'categoria' && (
                <Card className="dashboard-card" data-testid="cat-report"><CardHeader><CardTitle className="font-heading">Por Categoria</CardTitle></CardHeader><CardContent>
                    {data?.por_categoria?.length > 0 ? (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left py-2 px-3 text-sm">Categoria</th><th className="text-right py-2 px-3 text-sm">Receitas</th><th className="text-right py-2 px-3 text-sm">Despesas</th></tr></thead>
                            <tbody>{data.por_categoria.map(c => (<tr key={c.nome} className="border-b border-slate-50"><td className="py-2 px-3 text-sm flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: c.cor}} />{c.nome}</td><td className="py-2 px-3 text-sm text-right text-green-600">{fmt(c.receita)}</td><td className="py-2 px-3 text-sm text-right text-red-600">{fmt(c.despesa)}</td></tr>))}</tbody></table></div>
                    ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                </CardContent></Card>
            )}

            {reportType === 'completo' && (
                <Card className="dashboard-card"><CardHeader><CardTitle className="font-heading">Todas Transacoes ({txs.length})</CardTitle></CardHeader><CardContent>
                    {txs.length > 0 ? (
                        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b"><th className="text-left py-2 px-3 text-sm">Data</th><th className="text-left py-2 px-3 text-sm">Tipo</th><th className="text-left py-2 px-3 text-sm">Descricao</th><th className="text-right py-2 px-3 text-sm">Valor</th><th className="text-center py-2 px-3 text-sm">Status</th></tr></thead>
                            <tbody>{txs.map(t => (<tr key={t.id} className="border-b border-slate-50"><td className="py-2 px-3 text-sm">{t.data}</td><td className="py-2 px-3 text-sm capitalize">{t.tipo}</td><td className="py-2 px-3 text-sm max-w-[200px] truncate">{t.descricao || '-'}</td><td className={`py-2 px-3 text-sm text-right font-bold ${t.tipo === 'receita' ? 'text-green-600' : t.tipo === 'despesa' ? 'text-red-600' : 'text-blue-600'}`}>{fmt(t.valor)}</td><td className="py-2 px-3 text-center"><Badge className={`${t.status === 'confirmado' ? 'bg-green-100 text-green-700' : t.status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</Badge></td></tr>))}</tbody></table></div>
                    ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                </CardContent></Card>
            )}
        </div>
    );
}
