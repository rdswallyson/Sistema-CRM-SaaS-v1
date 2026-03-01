import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Download, Loader2, Calendar, Users, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AgendaExportarPage() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [exportingEvents, setExportingEvents] = useState(false);
    const [exportingInscritos, setExportingInscritos] = useState(false);
    const [eventosExport, setEventosExport] = useState(null);
    const [inscritosExport, setInscritosExport] = useState(null);

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        try { const r = await churchAPI.getEvents(); setEvents(r.data || []); } catch {}
    };

    const exportarEventos = async () => {
        setExportingEvents(true);
        try {
            const params = {};
            if (dataInicio) params.data_inicio = dataInicio;
            if (dataFim) params.data_fim = dataFim;
            const r = await churchAPI.exportarEventos(params);
            setEventosExport(r.data);
            toast.success(`${r.data.total} eventos exportados`);
        } catch { toast.error('Erro ao exportar'); }
        setExportingEvents(false);
    };

    const exportarInscritos = async () => {
        if (!selectedEventId) return toast.error('Selecione um evento');
        setExportingInscritos(true);
        try {
            const r = await churchAPI.exportarInscricoes(selectedEventId);
            setInscritosExport(r.data);
            toast.success(`${r.data.total} inscritos exportados`);
        } catch { toast.error('Erro ao exportar'); }
        setExportingInscritos(false);
    };

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return toast.error('Nenhum dado para exportar');
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6" data-testid="agenda-exportar-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Exportar</h1>
                <p className="text-sm text-slate-500">Exporte dados de eventos, inscritos e relatorios</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Events */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Calendar className="h-5 w-5 text-blue-500" />Exportar Eventos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Data Inicio</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
                            <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                        </div>
                        <Button onClick={exportarEventos} disabled={exportingEvents} className="w-full" data-testid="export-events-btn">
                            {exportingEvents ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Gerar Relatorio
                        </Button>
                        {eventosExport && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <p className="font-medium text-sm">{eventosExport.total} eventos encontrados</p>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => downloadCSV(eventosExport.events, 'eventos.csv')} data-testid="download-events-csv">
                                    <FileText className="h-4 w-4 mr-2" />Baixar CSV
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export Inscricoes */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-green-500" />Exportar Lista de Inscritos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Selecione o Evento</Label>
                            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                <SelectTrigger data-testid="export-event-select"><SelectValue placeholder="Escolha um evento" /></SelectTrigger>
                                <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.title} ({e.event_date})</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Button onClick={exportarInscritos} disabled={exportingInscritos} className="w-full" data-testid="export-inscritos-btn">
                            {exportingInscritos ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Gerar Lista
                        </Button>
                        {inscritosExport && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <p className="font-medium text-sm">{inscritosExport.total} inscritos - {inscritosExport.evento_titulo}</p>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => downloadCSV(inscritosExport.inscricoes, 'inscritos.csv')} data-testid="download-inscritos-csv">
                                    <FileText className="h-4 w-4 mr-2" />Baixar CSV
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
