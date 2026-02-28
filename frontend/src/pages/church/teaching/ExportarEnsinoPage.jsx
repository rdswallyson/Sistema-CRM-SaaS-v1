import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportarEnsinoPage() {
    const [turmas, setTurmas] = useState([]);
    const [escolas, setEscolas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportType, setExportType] = useState('turmas');
    const [selectedId, setSelectedId] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, eRes] = await Promise.all([churchAPI.getTurmas(), churchAPI.getEscolas()]);
                setTurmas(tRes.data || []);
                setEscolas(eRes.data || []);
            } catch { toast.error('Erro'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const exportTurmas = () => {
        let csv = 'Turma,Escola,Professor,Alunos,Status,Inicio,Fim\n';
        turmas.forEach(t => {
            csv += `"${t.nome}","${t.escola_nome || ''}","${t.professor_nome || ''}",${t.aluno_count || 0},"${t.status}","${t.data_inicio || ''}","${t.data_fim || ''}"\n`;
        });
        downloadCSV(csv, 'lista_turmas');
    };

    const exportAlunosTurma = async () => {
        if (selectedId === 'all') { exportTurmas(); return; }
        try {
            const res = await churchAPI.getTurma(selectedId);
            const t = res.data;
            let csv = `Turma: ${t.nome}\nProfessor: ${t.professor_nome || '-'}\n\nNome,Email,Telefone\n`;
            (t.alunos || []).forEach(a => {
                csv += `"${a.name}","${a.email || ''}","${a.phone || ''}"\n`;
            });
            downloadCSV(csv, `alunos_${t.nome}`);
        } catch { toast.error('Erro ao exportar'); }
    };

    const exportEscolas = () => {
        let csv = 'Escola,Responsavel,Departamento,Turmas,Status\n';
        escolas.forEach(e => {
            csv += `"${e.nome}","${e.responsavel_nome || ''}","${e.departamento_nome || ''}",${e.turma_count || 0},"${e.status}"\n`;
        });
        downloadCSV(csv, 'lista_escolas');
    };

    const handleExport = () => {
        if (exportType === 'turmas') exportTurmas();
        else if (exportType === 'alunos') exportAlunosTurma();
        else if (exportType === 'escolas') exportEscolas();
    };

    const downloadCSV = (csv, name) => {
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Exportado com sucesso!');
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="exportar-ensino-title">Exportar Dados do Ensino</h1>
                <p className="text-slate-500">Exporte listas de turmas, alunos e escolas</p>
            </div>

            <Card className="dashboard-card" data-testid="export-ensino-section">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><FileText className="w-5 h-5" /> Exportar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de exportacao</label>
                        <Select value={exportType} onValueChange={(v) => { setExportType(v); setSelectedId('all'); }}>
                            <SelectTrigger data-testid="export-type-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="turmas">Lista de turmas</SelectItem>
                                <SelectItem value="alunos">Alunos por turma</SelectItem>
                                <SelectItem value="escolas">Lista de escolas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {exportType === 'alunos' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Selecione a turma</label>
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger data-testid="export-turma-select"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas (lista geral)</SelectItem>
                                    {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800" data-testid="export-ensino-btn">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
