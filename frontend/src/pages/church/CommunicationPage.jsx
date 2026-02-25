import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    MessageSquare,
    Mail,
    Phone,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CommunicationPage() {
    const [channel, setChannel] = useState('email');
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membersRes, historyRes] = await Promise.all([
                churchAPI.getMembers(),
                churchAPI.getCommunicationHistory(),
            ]);
            setMembers(membersRes.data);
            setHistory(historyRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('Digite uma mensagem');
            return;
        }
        if (selectedMembers.length === 0) {
            toast.error('Selecione pelo menos um destinatário');
            return;
        }

        setSending(true);
        try {
            await churchAPI.sendCommunication(channel, selectedMembers, message, subject);
            toast.success(`Mensagem enviada via ${channel.toUpperCase()}!`);
            setMessage('');
            setSubject('');
            setSelectedMembers([]);
            fetchData();
        } catch (error) {
            toast.error('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const toggleMember = (memberId) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const selectAll = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map((m) => m.id));
        }
    };

    const channelConfig = {
        email: { icon: Mail, label: 'Email', color: 'bg-blue-100 text-blue-700' },
        sms: { icon: Phone, label: 'SMS', color: 'bg-green-100 text-green-700' },
        whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700' },
    };

    const statusConfig = {
        pending: { icon: Clock, label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
        queued: { icon: Clock, label: 'Na Fila', color: 'bg-blue-100 text-blue-700' },
        sent: { icon: CheckCircle, label: 'Enviado', color: 'bg-green-100 text-green-700' },
        failed: { icon: AlertCircle, label: 'Falhou', color: 'bg-red-100 text-red-700' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Comunicação</h1>
                <p className="text-slate-500">Envie mensagens para seus membros</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Compose Message */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="dashboard-card">
                        <CardHeader>
                            <CardTitle className="font-heading">Nova Mensagem</CardTitle>
                            <CardDescription>Escolha o canal e escreva sua mensagem</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Canal de Comunicação</Label>
                                <div className="flex gap-2">
                                    {Object.entries(channelConfig).map(([key, config]) => {
                                        const Icon = config.icon;
                                        return (
                                            <Button
                                                key={key}
                                                variant={channel === key ? 'default' : 'outline'}
                                                onClick={() => setChannel(key)}
                                                className={channel === key ? 'bg-slate-900' : ''}
                                                data-testid={`channel-${key}-btn`}
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {config.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {channel === 'email' && (
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Assunto</Label>
                                    <input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Assunto do email..."
                                        className="w-full h-10 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                        data-testid="email-subject-input"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem</Label>
                                <textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Digite sua mensagem aqui..."
                                    className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                    data-testid="message-textarea"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-slate-500">
                                    {selectedMembers.length} destinatário(s) selecionado(s)
                                </p>
                                <Button
                                    onClick={handleSend}
                                    disabled={sending || selectedMembers.length === 0}
                                    className="bg-slate-900 hover:bg-slate-800"
                                    data-testid="send-message-btn"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Enviar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card className="dashboard-card" data-testid="communication-history">
                        <CardHeader>
                            <CardTitle className="font-heading">Histórico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length > 0 ? (
                                <div className="space-y-3">
                                    {history.slice(0, 10).map((item, index) => {
                                        const chConfig = channelConfig[item.channel] || channelConfig.email;
                                        const stConfig = statusConfig[item.status] || statusConfig.pending;
                                        const ChIcon = chConfig.icon;

                                        return (
                                            <div
                                                key={item.id || index}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${chConfig.color} flex items-center justify-center shrink-0`}>
                                                    <ChIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={stConfig.color}>
                                                            {stConfig.label}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            {formatDateTime(item.sent_at)}
                                                        </span>
                                                    </div>
                                                    {item.subject && (
                                                        <p className="font-medium text-slate-900 text-sm">
                                                            {item.subject}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-slate-600 truncate">
                                                        {item.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {item.recipient_ids?.length || 0} destinatário(s)
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Nenhuma mensagem enviada</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recipients */}
                <Card className="dashboard-card h-fit" data-testid="recipients-list">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Destinatários
                        </CardTitle>
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedMembers.length === members.length && members.length > 0}
                                onCheckedChange={selectAll}
                                data-testid="select-all-checkbox"
                            />
                            <Label htmlFor="select-all" className="text-sm cursor-pointer">
                                Selecionar todos
                            </Label>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedMembers.includes(member.id)
                                            ? 'bg-brand-sky/10'
                                            : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => toggleMember(member.id)}
                                >
                                    <Checkbox
                                        checked={selectedMembers.includes(member.id)}
                                        onCheckedChange={() => toggleMember(member.id)}
                                        data-testid={`member-checkbox-${member.id}`}
                                    />
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 text-sm truncate">
                                            {member.name}
                                        </p>
                                        {member.email && (
                                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {members.length === 0 && (
                                <p className="text-center text-slate-500 py-4">
                                    Nenhum membro cadastrado
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
