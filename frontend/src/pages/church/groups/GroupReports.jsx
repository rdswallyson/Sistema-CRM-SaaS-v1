import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { FileText, Loader2, Download, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupReports() {
    const [groups, setGroups] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gRes, dRes] = await Promise.all([
                    churchAPI.getGroups(),
                    churchAPI.getGroupsStrategicDashboard(),
                ]);
                setGroups(gRes.data || []);
                setDashboard(dRes.data);
            } catch (e) { toast.error('Erro ao carregar'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const exportCSV = () => {
        let csv = 'Grupo,Categoria,Departamento,Líder,Participantes,Status\n';
        groups.forEach(g => {
            csv += `"${g.name}","${g.category_name || ''}","${g.department_name || ''}","${g.leader_name || ''}",${g.member_count || 0},"${g.status}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `relatorio_grupos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Relatório exportado!');
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;

    const ranking = dashboard?.ranking || [];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Relatórios de Grupos</h1>
                    <p className="text-slate-500">Visão geral e ranking dos grupos</p>
                </div>
                <Button variant="outline" onClick={exportCSV} data-testid="export-report-btn">
                    <Download className="w-4 h-4 mr-2" /> Exportar CSV
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900">{dashboard?.total_groups || 0}</p>
                    <p className="text-sm text-slate-500">Grupos Ativos</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900">{dashboard?.total_participants || 0}</p>
                    <p className="text-sm text-slate-500">Total Participantes</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-amber-600">{dashboard?.total_closed || 0}</p>
                    <p className="text-sm text-slate-500">Encerrados</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-600">{ranking[0]?.member_count || 0}</p>
                    <p className="text-sm text-slate-500">Maior Grupo</p>
                </CardContent></Card>
            </div>

            {/* Ranking */}
            <Card className="dashboard-card" data-testid="group-ranking">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Ranking por Participantes</CardTitle></CardHeader>
                <CardContent>
                    {ranking.length > 0 ? (
                        <div className="space-y-3">
                            {ranking.map((g, i) => (
                                <div key={g.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1"><p className="font-medium text-slate-900">{g.name}</p></div>
                                    <Badge variant="outline">{g.member_count} membros</Badge>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-4 text-slate-400">Nenhum grupo com membros</p>}
                </CardContent>
            </Card>

            {/* Full table */}
            <Card className="dashboard-card">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><FileText className="w-5 h-5" /> Todos os Grupos ({groups.length})</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-slate-100">
                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-500">Grupo</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Categoria</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Líder</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-500">Membros</th>
                                <th className="text-left py-2 px-3 text-sm font-medium text-slate-500">Status</th>
                            </tr></thead>
                            <tbody>
                                {groups.map(g => (
                                    <tr key={g.id} className="border-b border-slate-50">
                                        <td className="py-2 px-3 text-sm font-medium text-slate-900">{g.name}</td>
                                        <td className="py-2 px-3 text-sm text-slate-600 hidden md:table-cell">{g.category_name || '-'}</td>
                                        <td className="py-2 px-3 text-sm text-slate-600 hidden md:table-cell">{g.leader_name || '-'}</td>
                                        <td className="py-2 px-3 text-sm text-slate-900 font-medium">{g.member_count || 0}</td>
                                        <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{g.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
