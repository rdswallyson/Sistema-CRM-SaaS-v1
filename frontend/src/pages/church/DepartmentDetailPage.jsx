import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { churchAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    ArrowLeft, Users, Building2, Loader2, Trash2, Download,
    MoreVertical, Calendar, Briefcase, UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DepartmentDetailPage() {
    const { deptId } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDepartment(); }, [deptId]);

    const fetchDepartment = async () => {
        try {
            const res = await churchAPI.getDepartment(deptId);
            setDepartment(res.data);
        } catch (e) {
            toast.error('Erro ao carregar departamento');
            navigate('/dashboard/departments');
        } finally { setLoading(false); }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`Remover "${memberName}" deste departamento?`)) return;
        try {
            await churchAPI.removeDepartmentMember(deptId, memberId);
            toast.success('Membro removido do departamento');
            fetchDepartment();
        } catch (e) { toast.error('Erro ao remover membro'); }
    };

    const exportCSV = () => {
        if (!department?.members?.length) return;
        let csv = 'Nome,Email,Telefone,Cargo,Data de Entrada\n';
        department.members.forEach(m => {
            csv += `"${m.name}","${m.email || ''}","${m.phone || ''}","${m.position_name || ''}","${m.joined_at ? formatDate(m.joined_at) : ''}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `departamento_${department.name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Lista exportada!');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
    );

    if (!department) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/departments')} data-testid="back-to-departments">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-sky/10 to-brand-blue/10 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-brand-blue" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="dept-detail-name">{department.name}</h1>
                        {department.description && <p className="text-slate-500">{department.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={department.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {department.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={exportCSV} data-testid="export-dept-csv">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-slate-900">{department.member_count || 0}</p>
                        <p className="text-sm text-slate-500">Total de Membros</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm font-medium text-slate-900">{department.responsavel_name || '-'}</p>
                        <p className="text-sm text-slate-500">Responsável</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm font-medium text-slate-900">{department.meeting_schedule || '-'}</p>
                        <p className="text-sm text-slate-500">Reuniões</p>
                    </CardContent>
                </Card>
                <Card className="dashboard-card">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm font-medium text-slate-900">{department.created_at ? formatDate(department.created_at) : '-'}</p>
                        <p className="text-sm text-slate-500">Criado em</p>
                    </CardContent>
                </Card>
            </div>

            {/* Members Table */}
            <Card className="dashboard-card" data-testid="dept-members-table">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Participantes ({department.members?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {department.members && department.members.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Membro</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Cargo</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Contato</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden lg:table-cell">Entrada</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {department.members.map(member => (
                                        <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        {member.photo_url ? (
                                                            <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400">{member.name?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm">{member.name}</p>
                                                        <p className="text-xs text-slate-500">{member.email || ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                                    <Briefcase className="w-3 h-3" />
                                                    {member.position_name || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <p className="text-sm text-slate-600">{member.phone || '-'}</p>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <div className="flex items-center gap-1 text-sm text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {member.joined_at ? formatDate(member.joined_at) : '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id, member.name)}
                                                    className="text-red-500 hover:text-red-700" data-testid={`remove-member-${member.id}`}>
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
                            <p>Nenhum participante neste departamento</p>
                            <p className="text-sm mt-1">Edite o departamento para adicionar membros</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
