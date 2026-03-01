import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function FinExportar() {
    const [loading, setLoading] = useState(true);
    const [contas, setContas] = useState([]);
    const [exportType, setExportType] = useState('transacoes');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    useEffect(() => {
        (async () => {
            try { const r = await churchAPI.getFinContas(); setContas(r.data || []); }
            catch { toast.error('Erro'); }
            finally { setLoading(false); }
        })();
    }, []);

    const handleExport = async () => {
        try {
            let csv = '';
            if (exportType === 'transacoes') {
                const params = {};
                if (dataInicio) params.data_inicio = dataInicio;
                if (dataFim) params.data_fim = dataFim;
                const res = await churchAPI.getFinTransacoes(params);
                const txs = res.data || [];
                csv = 'Data,Tipo,Valor,Descricao,Categoria,Conta,Status\n';
                txs.forEach(t => { csv += `${t.data},${t.tipo},${t.valor},"${t.descricao || ''}","${t.categoria_nome || ''}","${t.conta_nome || ''}",${t.status}\n`; });
            } else if (exportType === 'contas') {
                csv = 'Conta,Tipo,Saldo Atual,Saldo Inicial,Status\n';
                contas.forEach(c => { csv += `"${c.nome}",${c.tipo},${c.saldo_atual || 0},${c.saldo_inicial || 0},${c.status}\n`; });
            } else if (exportType === 'resumo') {
                const res = await churchAPI.getFinResumo();
                const d = res.data;
                csv = 'Metrica,Valor\n';
                csv += `Saldo Total,${d.saldo_total}\nReceitas Mes,${d.receitas_mes}\nDespesas Mes,${d.despesas_mes}\nResultado Mes,${d.resultado_mes}\nTotal Receitas,${d.total_receitas}\nTotal Despesas,${d.total_despesas}\n`;
            }
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url;
            a.download = `financeiro_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click(); URL.revokeObjectURL(url);
            toast.success('Exportado com sucesso!');
        } catch { toast.error('Erro ao exportar'); }
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-exportar-title">Exportar Dados Financeiros</h1>
                <p className="text-slate-500">Exporte transacoes, contas e resumos</p>
            </div>

            <Card className="dashboard-card" data-testid="export-fin-section">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><FileText className="w-5 h-5" /> Exportar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tipo de exportacao</Label>
                        <Select value={exportType} onValueChange={setExportType}>
                            <SelectTrigger data-testid="fin-export-type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transacoes">Transacoes</SelectItem>
                                <SelectItem value="contas">Contas</SelectItem>
                                <SelectItem value="resumo">Resumo Financeiro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {exportType === 'transacoes' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Data Inicio</Label><Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
                        </div>
                    )}
                    <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800" data-testid="fin-export-btn">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
