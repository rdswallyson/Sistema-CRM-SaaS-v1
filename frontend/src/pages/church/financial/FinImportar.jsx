import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Loader2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FinImportar() {
    const [contas, setContas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [csvData, setCsvData] = useState('');
    const [preview, setPreview] = useState([]);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [defaultContaId, setDefaultContaId] = useState('');
    const [defaultCatId, setDefaultCatId] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [cRes, catRes] = await Promise.all([churchAPI.getFinContas(), churchAPI.getFinCategorias()]);
                setContas(cRes.data || []);
                setCategorias(catRes.data || []);
            } catch { toast.error('Erro'); }
            finally { setLoading(false); }
        })();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            setCsvData(text);
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) { setPreview([]); return; }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((h, j) => { row[h] = vals[j] || ''; });
            rows.push(row);
        }
        setPreview(rows);
    };

    const handleImport = async () => {
        if (preview.length === 0) { toast.error('Nenhum dado para importar'); return; }
        setSubmitting(true);
        try {
            const rows = preview.map(r => ({
                tipo: r.tipo || 'receita',
                valor: r.valor || '0',
                data: r.data || new Date().toISOString().split('T')[0],
                descricao: r.descricao || r.descrição || '',
                conta_id: defaultContaId || undefined,
                categoria_id: defaultCatId || undefined,
                status: r.status || 'confirmado',
            }));
            const res = await churchAPI.importarTransacoes({ rows });
            setResult(res.data);
            toast.success(`${res.data.imported} transacao(oes) importada(s)!`);
        } catch (err) { toast.error(err.response?.data?.detail || 'Erro na importacao'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="fin-importar-title">Importar Transacoes</h1>
                <p className="text-slate-500">Importe transacoes via arquivo CSV</p>
            </div>

            <Card className="dashboard-card">
                <CardHeader><CardTitle className="font-heading">Formato do CSV</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-2">O arquivo CSV deve conter as colunas: <span className="font-mono bg-slate-100 px-1 rounded">tipo,valor,data,descricao,status</span></p>
                    <p className="text-xs text-slate-400">Exemplo: receita,150.00,2026-02-15,Dizimo membro X,confirmado</p>
                </CardContent>
            </Card>

            <Card className="dashboard-card" data-testid="import-section">
                <CardHeader><CardTitle className="font-heading"><Upload className="w-5 h-5 inline mr-2" />Upload CSV</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" data-testid="csv-file-input" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Conta padrao</label>
                            <Select value={defaultContaId} onValueChange={setDefaultContaId}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhuma</SelectItem>
                                    {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria padrao</label>
                            <Select value={defaultCatId} onValueChange={setDefaultCatId}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhuma</SelectItem>
                                    {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {preview.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Preview ({preview.length} linhas)</p>
                            <div className="max-h-48 overflow-auto border rounded-lg">
                                <table className="w-full text-xs"><thead><tr className="bg-slate-50">{Object.keys(preview[0]).map(k => <th key={k} className="py-1 px-2 text-left">{k}</th>)}</tr></thead>
                                    <tbody>{preview.slice(0, 10).map((r, i) => <tr key={i} className="border-t">{Object.values(r).map((v, j) => <td key={j} className="py-1 px-2">{v}</td>)}</tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <Button onClick={handleImport} disabled={submitting || preview.length === 0} className="bg-slate-900 hover:bg-slate-800" data-testid="import-btn">
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Importar {preview.length} linha(s)
                    </Button>

                    {result && (
                        <div className="p-4 rounded-lg bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium">{result.imported} importada(s)</span></div>
                            {result.errors?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" /><span className="font-medium text-red-600">{result.errors.length} erro(s)</span></div>
                                    <ul className="text-xs text-red-500 mt-1 space-y-1">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
