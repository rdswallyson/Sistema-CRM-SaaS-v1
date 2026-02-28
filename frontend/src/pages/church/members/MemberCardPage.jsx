import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { IdCard, Loader2, Download, Printer, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MemberCardPage() {
    const [members, setMembers] = useState([]);
    const [positions, setPositions] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [loading, setLoading] = useState(true);
    const cardRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, pRes] = await Promise.all([
                    churchAPI.getMembers({ per_page: 1000 }),
                    churchAPI.getMemberPositions(),
                ]);
                setMembers(mRes.data.items || []);
                setPositions(pRes.data || []);
            } catch (e) { toast.error('Erro ao carregar dados'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const member = members.find(m => m.id === selectedMemberId);
    const getPositionName = (id) => positions.find(p => p.id === id)?.name || '';

    const handlePrint = () => {
        const printContent = cardRef.current;
        if (!printContent) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Cartão - ${member?.name}</title>
            <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
                .card { width: 340px; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 24px; text-align: center; }
                .header h2 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; }
                .photo { width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; margin: 16px auto; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .photo img { width: 100%; height: 100%; object-fit: cover; }
                .body { padding: 20px; text-align: center; }
                .name { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
                .position { font-size: 14px; color: #64748b; margin: 0 0 16px; }
                .qr { margin: 16px auto; padding: 12px; background: #f8fafc; border-radius: 8px; display: inline-block; }
                .qr img { width: 120px; height: 120px; }
                .footer { text-align: center; padding: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
            </style></head><body>
            ${printContent.innerHTML}
            <script>window.onload=function(){window.print();window.close();}</script>
            </body></html>
        `);
        win.document.close();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Cartão do Membro</h1>
                <p className="text-slate-500">Gere cartões digitais para os membros</p>
            </div>

            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Selecione o membro</label>
                            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                <SelectTrigger data-testid="select-member-card"><SelectValue placeholder="Escolha um membro" /></SelectTrigger>
                                <SelectContent>
                                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {member && (
                            <Button variant="outline" onClick={handlePrint} data-testid="print-card-btn">
                                <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {member ? (
                <div className="flex justify-center">
                    <div ref={cardRef}>
                        <div className="card w-[340px] border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg" data-testid="member-card">
                            <div className="bg-gradient-to-br from-brand-sky to-brand-blue text-white p-6 text-center">
                                <h2 className="text-sm font-semibold tracking-wider uppercase">Firmes</h2>
                                <div className="w-20 h-20 rounded-full border-3 border-white mx-auto mt-4 bg-white/20 flex items-center justify-center overflow-hidden">
                                    {member.photo_url ? (
                                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-8 h-8 text-white/70" />
                                    )}
                                </div>
                            </div>
                            <div className="p-5 text-center">
                                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {getPositionName(member.position_id) || 'Membro'}
                                </p>
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg inline-block">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(member.id)}`}
                                        alt="QR Code"
                                        className="w-[120px] h-[120px]"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-3">ID: {member.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-center py-3 border-t border-slate-100 text-xs text-slate-400">
                                Igreja Firmes - Cartão de Membro
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <Card className="dashboard-card">
                    <CardContent className="py-12 text-center">
                        <IdCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Selecione um membro para gerar o cartão</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
