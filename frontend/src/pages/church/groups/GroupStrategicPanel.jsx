import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Users, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GroupStrategicPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await churchAPI.getGroupsStrategicDashboard();
                setData(res.data);
            } catch (e) { toast.error('Erro ao carregar painel'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>;
    if (!data) return null;

    const maxCatVal = Math.max(...Object.values(data.by_category || {}), 1);
    const maxDeptVal = Math.max(...Object.values(data.by_department || {}), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Painel Estratégico</h1>
                <p className="text-slate-500">Visão estratégica dos grupos da igreja</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-brand-blue">{data.total_groups}</p>
                    <p className="text-sm text-slate-500">Grupos Ativos</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-600">{data.total_participants}</p>
                    <p className="text-sm text-slate-500">Total Participantes</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-amber-600">{data.total_closed}</p>
                    <p className="text-sm text-slate-500">Encerrados</p>
                </CardContent></Card>
                <Card className="dashboard-card"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-purple-600">{data.ranking?.[0]?.name?.slice(0, 15) || '-'}</p>
                    <p className="text-sm text-slate-500">Maior Grupo</p>
                </CardContent></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* By Category Chart */}
                <Card className="dashboard-card" data-testid="chart-by-category">
                    <CardHeader><CardTitle className="font-heading flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Grupos por Categoria</CardTitle></CardHeader>
                    <CardContent>
                        {Object.keys(data.by_category || {}).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(data.by_category).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-700 font-medium">{name}</span>
                                            <span className="text-slate-500">{count}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-brand-sky to-brand-blue rounded-full transition-all"
                                                style={{ width: `${(count / maxCatVal) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                    </CardContent>
                </Card>

                {/* By Department Chart */}
                <Card className="dashboard-card" data-testid="chart-by-department">
                    <CardHeader><CardTitle className="font-heading flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Grupos por Departamento</CardTitle></CardHeader>
                    <CardContent>
                        {Object.keys(data.by_department || {}).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(data.by_department).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                                    <div key={name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-700 font-medium">{name}</span>
                                            <span className="text-slate-500">{count}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                                                style={{ width: `${(count / maxDeptVal) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-center py-4 text-slate-400">Sem dados</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Top Groups Ranking */}
            <Card className="dashboard-card" data-testid="strategic-ranking">
                <CardHeader><CardTitle className="font-heading flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Top 10 Grupos</CardTitle></CardHeader>
                <CardContent>
                    {data.ranking?.length > 0 ? (
                        <div className="space-y-2">
                            {data.ranking.map((g, i) => (
                                <div key={g.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1"><p className="font-medium text-slate-900">{g.name}</p></div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                        <Users className="w-4 h-4" /> {g.member_count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-center py-4 text-slate-400">Nenhum grupo encontrado</p>}
                </CardContent>
            </Card>
        </div>
    );
}
