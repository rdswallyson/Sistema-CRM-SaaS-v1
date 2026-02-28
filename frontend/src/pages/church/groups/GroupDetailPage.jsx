import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Users, Loader2, Download, Briefcase, Calendar, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupDetailPage() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchGroup(); }, [groupId]);

    const fetchGroup = async () => {
        try { const res = await churchAPI.getGroup(groupId); setGroup(res.data); }
        catch (e) { toast.error('Erro ao carregar grupo'); navigate('/dashboard/groups'); }
        finally { setLoading(false); }
    };

    const handleRemove = async (memberId, memberName) => {
        if (!window.confirm(`Remover "${memberName}" deste grupo?`)) return;
        try {
            await churchAPI.removeGroupMember(groupId, memberId);
            toast.success('Membro removido');
            fetchGroup();
        } catch (e) { toast.error('Erro ao remover'); }
    };

    const exportCSV = () => {
        if (!group?.members?.length) return;
        let csv = 'Nome,Email,Telefone,Cargo,Data de Entrada\n';
        group.members.forEach(m => {
            csv += `"${m.name}","${m.email || ''}","${m.phone || ''}","${m.position_name || ''}","${m.joined_at ? formatDate(m.joined_at) : ''}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `grupo_${group.name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Lista exportada!');
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!group) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/groups')} data-testid="back-to-groups">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="group-detail-name">{group.name}</h1>
                    {group.description && <p className="text-slate-500">{group.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {group.status === 'active' ? 'Ativo' : 'Encerrado'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={exportCSV} data-testid="export-group-csv">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900">{group.member_count || 0}</p>
                    <p className="text-sm text-slate-500">Participantes</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{group.leader_name || '-'}</p>
                    <p className="text-sm text-slate-500">Líder</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{group.category_name || '-'}</p>
                    <p className="text-sm text-slate-500">Categoria</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{group.department_name || '-'}</p>
                    <p className="text-sm text-slate-500">Departamento</p>
                </CardContent></Card>
            </div>

            <Card className="dashboard-card" data-testid="group-members-table">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Users className="w-5 h-5" /> Participantes ({group.members?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                    {group.members?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Membro</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Cargo</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Contato</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden lg:table-cell">Entrada</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Ação</th>
                                </tr></thead>
                                <tbody>
                                    {group.members.map(m => (
                                        <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                                            <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>}
                                                    </div>
                                                    <div><p className="font-medium text-slate-900 text-sm">{m.name}</p></div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell"><div className="flex items-center gap-1 text-sm text-slate-600"><Briefcase className="w-3 h-3" /> {m.position_name || '-'}</div></td>
                                            <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-600">{m.phone || m.email || '-'}</td>
                                            <td className="py-3 px-4 hidden lg:table-cell"><div className="flex items-center gap-1 text-sm text-slate-500"><Calendar className="w-3 h-3" /> {m.joined_at ? formatDate(m.joined_at) : '-'}</div></td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id, m.name)} className="text-red-500" data-testid={`remove-${m.id}`}>
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum participante neste grupo</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
