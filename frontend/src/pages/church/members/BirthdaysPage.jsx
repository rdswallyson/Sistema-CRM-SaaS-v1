import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Cake, Loader2, Users, Star } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function BirthdaysPage() {
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));

    useEffect(() => { fetchBirthdays(); }, [selectedMonth]);

    const fetchBirthdays = async () => {
        setLoading(true);
        try {
            const res = await churchAPI.getMemberBirthdays(parseInt(selectedMonth));
            setBirthdays(res.data || []);
        } catch (e) { toast.error('Erro ao carregar aniversariantes'); }
        finally { setLoading(false); }
    };

    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Aniversariantes</h1>
                    <p className="text-slate-500">Aniversariantes do mês</p>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48" data-testid="month-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {monthNames.map((name, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="dashboard-card" data-testid="birthdays-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Cake className="w-5 h-5" />
                        {monthNames[parseInt(selectedMonth) - 1]} ({birthdays.length} aniversariantes)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
                    ) : birthdays.length > 0 ? (
                        <div className="space-y-3">
                            {birthdays.map(member => {
                                const isToday = member.birth_day === todayDay && parseInt(selectedMonth) === todayMonth;
                                return (
                                    <div key={member.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isToday ? 'bg-amber-50 border border-amber-200 ring-2 ring-amber-100' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900">{member.name}</p>
                                                {isToday && (
                                                    <Badge className="bg-amber-100 text-amber-700">
                                                        <Star className="w-3 h-3 mr-1" /> Hoje!
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {member.birth_date ? formatDate(member.birth_date) : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-300">{member.birth_day}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Cake className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum aniversariante em {monthNames[parseInt(selectedMonth) - 1]}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
