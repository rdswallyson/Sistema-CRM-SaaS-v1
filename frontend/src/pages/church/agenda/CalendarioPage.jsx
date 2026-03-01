import { useState, useEffect, useMemo } from 'react';
import { churchAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, List, LayoutGrid, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_COLORS = {
    evento: 'bg-blue-500', aviso: 'bg-amber-500', aniversario: 'bg-pink-500',
    financeiro: 'bg-emerald-500', ensino: 'bg-violet-500',
};
const TYPE_LABELS = {
    evento: 'Evento', aviso: 'Aviso', aniversario: 'Aniversario', financeiro: 'Financeiro', ensino: 'Ensino',
};
const MONTH_NAMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

export default function CalendarioPage() {
    const [items, setItems] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [view, setView] = useState('month');
    const [filterType, setFilterType] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [filterDept, setFilterDept] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [month, year, filterType, filterDept]);
    useEffect(() => { fetchDepts(); }, []);

    const fetchDepts = async () => {
        try { const r = await churchAPI.getDepartments(); setDepartments(r.data || []); } catch {}
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { mes: month, ano: year };
            if (filterType !== 'all') params.tipo = filterType;
            if (filterDept) params.department_id = filterDept;
            const r = await churchAPI.getCalendario(params);
            setItems(r.data?.items || []);
        } catch { toast.error('Erro ao carregar calendario'); }
        setLoading(false);
    };

    const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [month, year]);

    const itemsByDate = useMemo(() => {
        const map = {};
        items.forEach(it => { const d = it.date; if (!map[d]) map[d] = []; map[d].push(it); });
        return map;
    }, [items]);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    return (
        <div className="space-y-6" data-testid="calendario-page">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Calendario</h1>
                    <p className="text-sm text-slate-500">Visao integrada de todos os eventos e datas importantes</p>
                </div>
                <div className="flex gap-2">
                    {[{v:'month',icon:LayoutGrid,l:'Mes'},{v:'list',icon:List,l:'Lista'}].map(({v,icon:Icon,l})=>(
                        <Button key={v} variant={view===v?'default':'outline'} size="sm" onClick={()=>setView(v)} data-testid={`view-${v}-btn`}><Icon className="h-4 w-4 mr-1" />{l}</Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg border px-2">
                    <Button variant="ghost" size="icon" onClick={prevMonth} data-testid="prev-month-btn"><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-semibold text-slate-700 min-w-[140px] text-center">{MONTH_NAMES[month-1]} {year}</span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="next-month-btn"><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[160px]" data-testid="filter-type"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="evento">Eventos</SelectItem>
                        <SelectItem value="aviso">Avisos</SelectItem>
                        <SelectItem value="aniversario">Aniversarios</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="ensino">Ensino</SelectItem>
                    </SelectContent>
                </Select>
                {departments.length > 0 && (
                    <Select value={filterDept} onValueChange={setFilterDept}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Departamento" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all_">Todos</SelectItem>
                            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mb-2">
                {Object.entries(TYPE_LABELS).map(([k,l])=>(
                    <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className={`w-3 h-3 rounded-full ${TYPE_COLORS[k]}`} />{l}
                    </span>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" /></div>
            ) : view === 'month' ? (
                <Card>
                    <CardContent className="p-2 sm:p-4">
                        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                            {DAY_NAMES.map(d => <div key={d} className="bg-slate-50 text-center text-xs font-semibold text-slate-500 py-2">{d}</div>)}
                            {calendarDays.map((day, i) => {
                                if (!day) return <div key={`e${i}`} className="bg-white min-h-[80px] sm:min-h-[100px]" />;
                                const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                const dayItems = itemsByDate[dateStr] || [];
                                const isToday = dateStr === todayStr;
                                return (
                                    <div key={day} className={`bg-white min-h-[80px] sm:min-h-[100px] p-1 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`} data-testid={`cal-day-${day}`}>
                                        <span className={`text-xs font-medium ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-600'}`}>{day}</span>
                                        <div className="mt-1 space-y-0.5 overflow-hidden max-h-[60px]">
                                            {dayItems.slice(0, 3).map((it, j) => (
                                                <div key={j} className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${TYPE_COLORS[it.type] || 'bg-gray-400'}`} title={it.title}>
                                                    {it.title}
                                                </div>
                                            ))}
                                            {dayItems.length > 3 && <span className="text-[10px] text-slate-400">+{dayItems.length - 3} mais</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader><CardTitle className="text-lg">Eventos do Mes</CardTitle></CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">Nenhum item neste mes</p>
                        ) : (
                            <div className="space-y-2">
                                {items.map((it, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors" data-testid={`cal-item-${i}`}>
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${TYPE_COLORS[it.type] || 'bg-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-800 truncate">{it.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <CalIcon className="h-3 w-3" />{it.date}
                                                {it.time && <><Clock className="h-3 w-3 ml-1" />{it.time}</>}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs capitalize">{TYPE_LABELS[it.type] || it.type}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
