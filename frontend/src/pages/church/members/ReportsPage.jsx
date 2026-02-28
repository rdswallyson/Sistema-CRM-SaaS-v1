import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { FileText, Loader2, Download, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
    const [members, setMembers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('general');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, cRes, pRes] = await Promise.all([
                    churchAPI.getMembers({ per_page: 5000 }),
                    churchAPI.getMemberCategories(),
                    churchAPI.getMemberPositions(),
                ]);
                setMembers(mRes.data.items || []);
                setCategories(cRes.data || []);
                setPositions(pRes.data || []);
            } catch (e) { toast.error('Erro ao carregar dados'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'Sem categoria';
    const getPositionName = (id) => positions.find(p => p.id === id)?.name || 'Sem cargo';

    const getGroupedData = () => {
        if (reportType === 'by_category') {
            const groups = {};
            members.forEach(m => {
                const key = getCategoryName(m.category_id);
                if (!groups[key]) groups[key] = [];
                groups[key].push(m);
            });
            return groups;
        }
        if (reportType === 'by_position') {
            const groups = {};
            members.forEach(m => {
                const key = getPositionName(m.position_id);
                if (!groups[key]) groups[key] = [];
                groups[key].push(m);
            });
            return groups;
        }
        return { 'Todos os Membros': members };
    };

    const exportCSV = () => {
        const grouped = getGroupedData();
        let csv = 'Nome,Email,Telefone,Status,Categoria,Cargo\n';
        Object.values(grouped).flat().forEach(m => {
            csv += `"${m.name}","${m.email || ''}","${m.phone || ''}","${m.status}","${getCategoryName(m.category_id)}","${getPositionName(m.position_id)}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_membros_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado!');
    };

    const grouped = getGroupedData();

    if (loading) return (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Relatórios</h1>
                    <p className="text-slate-500">Relatórios de membros</p>
                </div>
                <div className="flex gap-2">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-48" data-testid="report-type-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">Geral</SelectItem>
                            <SelectItem value="by_category">Por Categoria</SelectItem>
                            <SelectItem value="by_position">Por Cargo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-slate-900">{members.length}</p>
                        <p className="text-sm text-slate-500">Total</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-600">{members.filter(m => m.status === 'member').length}</p>
                        <p className="text-sm text-slate-500">Membros</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-purple-600">{members.filter(m => m.status === 'leader').length}</p>
                        <p className="text-sm text-slate-500">Líderes</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-amber-600">{members.filter(m => m.status === 'visitor').length}</p>
                        <p className="text-sm text-slate-500">Visitantes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Content */}
            {Object.entries(grouped).map(([groupName, groupMembers]) => (
                <Card key={groupName} className="dashboard-card">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {groupName} ({groupMembers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-500">Nome</th>
                                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Email</th>
                                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-500 hidden md:table-cell">Telefone</th>
                                        <th className="text-left py-2 px-3 text-sm font-medium text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupMembers.map(m => (
                                        <tr key={m.id} className="border-b border-slate-50">
                                            <td className="py-2 px-3 text-sm font-medium text-slate-900">{m.name}</td>
                                            <td className="py-2 px-3 text-sm text-slate-600 hidden md:table-cell">{m.email || '-'}</td>
                                            <td className="py-2 px-3 text-sm text-slate-600 hidden md:table-cell">{m.phone || '-'}</td>
                                            <td className="py-2 px-3">
                                                <Badge variant="outline" className="text-xs">{m.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
