import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Loader2, School, Users, BookOpen, BarChart3, TrendingUp, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function PainelAcademico() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try { const res = await churchAPI.getPainelAcademico(); setData(res.data); }
            catch { toast.error('Erro ao carregar painel'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!data) return null;

    const maxEscolaVal = Math.max(...(data.escola_stats || []).map(e => e.turmas), 1);
    const maxNivelVal = Math.max(...Object.values(data.by_nivel || {}), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900" data-testid="painel-academico-title">Painel Academico</h1>
                <p className="text-slate-500">Visao estrategica do sistema educacional</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <School className="w-6 h-6 mx-auto mb-1 text-brand-sky" />
                    <p className="text-2xl font-bold text-slate-900">{data.total_escolas}</p>
                    <p className="text-xs text-slate-500">Escolas</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-2xl font-bold text-slate-900">{data.total_turmas}</p>
                    <p className="text-xs text-slate-500">Turmas Ativas</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <Users className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold text-slate-900">{data.total_alunos}</p>
                    <p className="text-xs text-slate-500">Alunos Matriculados</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <GraduationCap className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-2xl font-bold text-slate-900">{data.total_estudos}</p>
                    <p className="text-xs text-slate-500">Estudos Ativos</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold text-slate-900">{data.taxa_conclusao}%</p>
                    <p className="text-xs text-slate-500">Taxa Conclusao</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                    <p className="text-2xl font-bold text-slate-900">{data.total_turmas_concluidas}</p>
                    <p className="text-xs text-slate-500">Turmas Concluidas</p>
                </CardContent></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="dashboard-card" data-testid="chart-escolas">
                    <CardHeader><CardTitle className="font-heading flex items-center gap-2"><School className="w-5 h-5" /> Turmas por Escola</CardTitle></CardHeader>
                    <CardContent>
                        {(data.escola_stats || []).length > 0 ? (
                            <div className="space-y-3">
                                {data.escola_stats.sort((a, b) => b.turmas - a.turmas).map(e => (
                                    <div key={e.nome}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-700 font-medium">{e.nome}</span>
                                            <span className="text-slate-500">{e.turmas}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-brand-sky to-brand-blue rounded-full transition-all"
                                                style={{ width: `${(e.turmas / maxEscolaVal) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                    </CardContent>
                </Card>

                <Card className="dashboard-card" data-testid="chart-niveis">
                    <CardHeader><CardTitle className="font-heading flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Estudos por Nivel</CardTitle></CardHeader>
                    <CardContent>
                        {Object.keys(data.by_nivel || {}).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(data.by_nivel).map(([nivel, count]) => (
                                    <div key={nivel}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-700 font-medium capitalize">{nivel}</span>
                                            <span className="text-slate-500">{count}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                                                style={{ width: `${(count / maxNivelVal) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                    </CardContent>
                </Card>
            </div>

            <Card className="dashboard-card" data-testid="turma-ranking">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Top 10 Turmas por Alunos</CardTitle></CardHeader>
                <CardContent>
                    {data.turma_ranking?.length > 0 ? (
                        <div className="space-y-2">
                            {data.turma_ranking.map((t, i) => (
                                <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1"><p className="font-medium text-slate-900">{t.nome}</p></div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <Users className="w-4 h-4" /> {t.aluno_count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-4 text-slate-400">Nenhuma turma encontrada</p>}
                </CardContent>
            </Card>
        </div>
    );
}
