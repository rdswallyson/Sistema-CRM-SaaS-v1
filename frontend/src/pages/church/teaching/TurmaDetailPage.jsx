import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Users, Loader2, Download, BookOpen, Calendar, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function TurmaDetailPage() {
    const { turmaId } = useParams();
    const navigate = useNavigate();
    const [turma, setTurma] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTurma(); }, [turmaId]);

    const fetchTurma = async () => {
        try { const res = await churchAPI.getTurma(turmaId); setTurma(res.data); }
        catch { toast.error('Erro ao carregar turma'); navigate('/dashboard/teaching/classes'); }
        finally { setLoading(false); }
    };

    const handleRemove = async (memberId, memberName) => {
        if (!window.confirm(`Remover "${memberName}" desta turma?`)) return;
        try { await churchAPI.removeTurmaMember(turmaId, memberId); toast.success('Aluno removido'); fetchTurma(); }
        catch { toast.error('Erro ao remover'); }
    };

    const exportCSV = () => {
        if (!turma?.alunos?.length) return;
        let csv = 'Nome,Email,Telefone,Data de Entrada\n';
        turma.alunos.forEach(m => {
            csv += `"${m.name}","${m.email || ''}","${m.phone || ''}","${m.data_entrada || ''}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `turma_${turma.nome}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Lista exportada!');
    };

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!turma) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/teaching/classes')} data-testid="back-to-turmas">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="turma-detail-name">{turma.nome}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={turma.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {turma.status === 'active' ? 'Ativa' : 'Concluida'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={exportCSV} data-testid="export-turma-csv">
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900">{turma.aluno_count || 0}</p>
                    <p className="text-sm text-slate-500">Alunos</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{turma.professor_nome || '-'}</p>
                    <p className="text-sm text-slate-500">Professor</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{turma.escola_nome || '-'}</p>
                    <p className="text-sm text-slate-500">Escola</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-slate-900">{turma.data_inicio || '-'}</p>
                    <p className="text-sm text-slate-500">Inicio</p>
                </CardContent></Card>
            </div>

            <Card className="dashboard-card" data-testid="turma-alunos-table">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><Users className="w-5 h-5" /> Alunos ({turma.alunos?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                    {turma.alunos?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Aluno</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 hidden md:table-cell">Telefone</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Acao</th>
                                </tr></thead>
                                <tbody>
                                    {turma.alunos.map(m => (
                                        <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> :
                                                            <span className="text-xs font-bold text-slate-400">{m.name?.[0]}</span>}
                                                    </div>
                                                    <p className="font-medium text-slate-900 text-sm">{m.name}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-600">{m.email || '-'}</td>
                                            <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-600">{m.phone || '-'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id, m.name)} className="text-red-500" data-testid={`remove-aluno-${m.id}`}>
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
                            <p>Nenhum aluno nesta turma</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {turma.estudos?.length > 0 && (
                <Card className="dashboard-card" data-testid="turma-estudos">
                    <CardHeader><CardTitle className="font-heading flex items-center gap-2"><BookOpen className="w-5 h-5" /> Estudos vinculados ({turma.estudos.length})</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {turma.estudos.map(e => (
                                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <BookOpen className="w-4 h-4 text-brand-sky" />
                                    <div className="flex-1"><p className="text-sm font-medium text-slate-900">{e.titulo}</p></div>
                                    <Badge variant="outline" className="text-xs">{e.nivel}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
