import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupExport() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try { const res = await churchAPI.getGroups(); setGroups(res.data || []); }
            catch (e) { toast.error('Erro'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const exportAll = () => {
        let csv = 'Grupo,Categoria,Departamento,Líder,Participantes,Status\n';
        groups.forEach(g => {
            csv += `"${g.name}","${g.category_name || ''}","${g.department_name || ''}","${g.leader_name || ''}",${g.member_count || 0},"${g.status}"\n`;
        });
        downloadCSV(csv, 'todos_grupos');
    };

    const exportGroupMembers = async () => {
        if (selectedGroupId === 'all') { exportAll(); return; }
        try {
            const res = await churchAPI.getGroup(selectedGroupId);
            const g = res.data;
            let csv = `Grupo: ${g.name}\nLíder: ${g.leader_name || '-'}\n\nNome,Email,Telefone,Cargo,Entrada\n`;
            (g.members || []).forEach(m => {
                csv += `"${m.name}","${m.email || ''}","${m.phone || ''}","${m.position_name || ''}","${m.joined_at ? formatDate(m.joined_at) : ''}"\n`;
            });
            downloadCSV(csv, `grupo_${g.name}`);
        } catch (e) { toast.error('Erro ao exportar'); }
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
                <h1 className="font-heading text-2xl font-bold text-slate-900">Exportar Dados</h1>
                <p className="text-slate-500">Exporte listas de grupos e participantes</p>
            </div>

            <Card className="dashboard-card" data-testid="export-section">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><FileText className="w-5 h-5" /> Exportar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione o que exportar</label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger data-testid="export-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Lista geral de grupos</SelectItem>
                                {groups.map(g => <SelectItem key={g.id} value={g.id}>Participantes: {g.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={exportGroupMembers} className="bg-slate-900 hover:bg-slate-800" data-testid="export-btn">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
