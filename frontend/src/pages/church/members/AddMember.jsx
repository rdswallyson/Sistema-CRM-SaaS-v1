import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';

export default function AddMember() {
    const navigate = useNavigate();
    const { memberId } = useParams();
    const isEditing = !!memberId;
    const [categories, setCategories] = useState([]);
    const [positions, setPositions] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditing);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', birth_date: '',
        gender: '', marital_status: '', profession: '', photo_url: '',
        status: 'visitor', baptism_date: '', conversion_date: '',
        family_id: '', family_role: '', ministry_ids: [], spiritual_gifts: [],
        notes: '', category_id: '', position_id: '', custom_fields: {},
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, posRes, cfRes] = await Promise.all([
                    churchAPI.getMemberCategories(),
                    churchAPI.getMemberPositions(),
                    churchAPI.getCustomFields(),
                ]);
                setCategories(catRes.data || []);
                setPositions(posRes.data || []);
                setCustomFields((cfRes.data || []).filter(f => f.is_active));

                if (isEditing) {
                    const memberRes = await churchAPI.getMember(memberId);
                    const m = memberRes.data;
                    setFormData({
                        name: m.name || '', email: m.email || '', phone: m.phone || '',
                        address: m.address || '', birth_date: m.birth_date || '',
                        gender: m.gender || '', marital_status: m.marital_status || '',
                        profession: m.profession || '', photo_url: m.photo_url || '',
                        status: m.status || 'visitor', baptism_date: m.baptism_date || '',
                        conversion_date: m.conversion_date || '', family_id: m.family_id || '',
                        family_role: m.family_role || '', ministry_ids: m.ministry_ids || [],
                        spiritual_gifts: m.spiritual_gifts || [], notes: m.notes || '',
                        category_id: m.category_id || '', position_id: m.position_id || '',
                        custom_fields: m.custom_fields || {},
                    });
                }
            } catch (e) {
                toast.error('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [memberId, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
        setSubmitting(true);
        try {
            if (isEditing) {
                await churchAPI.updateMember(memberId, formData);
                toast.success('Membro atualizado com sucesso!');
            } else {
                await churchAPI.createMember(formData);
                toast.success('Membro cadastrado com sucesso!');
            }
            navigate('/dashboard/members');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Erro ao salvar membro');
        } finally {
            setSubmitting(false);
        }
    };

    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
    const setCustomField = (fieldId, value) => setFormData(prev => ({
        ...prev, custom_fields: { ...prev.custom_fields, [fieldId]: value }
    }));

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/members')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <h1 className="font-heading text-2xl font-bold text-slate-900">
                    {isEditing ? 'Editar Membro' : 'Cadastrar Membro'}
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Photo */}
                <Card className="dashboard-card mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                                {formData.photo_url ? (
                                    <img src={formData.photo_url} alt="Foto" className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Label>URL da Foto</Label>
                                <Input value={formData.photo_url} onChange={(e) => setField('photo_url', e.target.value)}
                                    placeholder="https://exemplo.com/foto.jpg" className="mt-1" data-testid="member-photo-input" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dados Pessoais */}
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Dados Pessoais</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label>Nome Completo *</Label>
                                <Input value={formData.name} onChange={(e) => setField('name', e.target.value)}
                                    placeholder="João da Silva" required data-testid="member-name-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)}
                                    placeholder="joao@email.com" data-testid="member-email-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input value={formData.phone} onChange={(e) => setField('phone', e.target.value)}
                                    placeholder="(11) 99999-9999" data-testid="member-phone-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Nascimento</Label>
                                <Input type="date" value={formData.birth_date} onChange={(e) => setField('birth_date', e.target.value)}
                                    data-testid="member-birth-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Gênero</Label>
                                <Select value={formData.gender} onValueChange={(v) => setField('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Masculino</SelectItem>
                                        <SelectItem value="female">Feminino</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado Civil</Label>
                                <Select value={formData.marital_status} onValueChange={(v) => setField('marital_status', v)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Solteiro(a)</SelectItem>
                                        <SelectItem value="married">Casado(a)</SelectItem>
                                        <SelectItem value="divorced">Divorciado(a)</SelectItem>
                                        <SelectItem value="widowed">Viúvo(a)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Profissão</Label>
                                <Input value={formData.profession} onChange={(e) => setField('profession', e.target.value)}
                                    placeholder="Ex: Professor" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Endereço</Label>
                                <Input value={formData.address} onChange={(e) => setField('address', e.target.value)}
                                    placeholder="Rua, número, bairro, cidade" data-testid="member-address-input" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status na Igreja */}
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Status na Igreja</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setField('status', v)}>
                                    <SelectTrigger data-testid="member-status-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="visitor">Visitante</SelectItem>
                                        <SelectItem value="new_convert">Novo Convertido</SelectItem>
                                        <SelectItem value="member">Membro</SelectItem>
                                        <SelectItem value="leader">Líder</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {categories.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={formData.category_id} onValueChange={(v) => setField('category_id', v)}>
                                        <SelectTrigger data-testid="member-category-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {positions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Cargo</Label>
                                    <Select value={formData.position_id} onValueChange={(v) => setField('position_id', v)}>
                                        <SelectTrigger data-testid="member-position-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            {positions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Data de Conversão</Label>
                                <Input type="date" value={formData.conversion_date} onChange={(e) => setField('conversion_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data de Batismo</Label>
                                <Input type="date" value={formData.baptism_date} onChange={(e) => setField('baptism_date', e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                    <Card className="dashboard-card mb-6">
                        <CardHeader><CardTitle className="font-heading">Campos Adicionais</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label>{field.name} {field.is_required && '*'}</Label>
                                        {field.field_type === 'text' && (
                                            <Input value={formData.custom_fields[field.id] || ''}
                                                onChange={(e) => setCustomField(field.id, e.target.value)}
                                                required={field.is_required} />
                                        )}
                                        {field.field_type === 'number' && (
                                            <Input type="number" value={formData.custom_fields[field.id] || ''}
                                                onChange={(e) => setCustomField(field.id, e.target.value)}
                                                required={field.is_required} />
                                        )}
                                        {field.field_type === 'date' && (
                                            <Input type="date" value={formData.custom_fields[field.id] || ''}
                                                onChange={(e) => setCustomField(field.id, e.target.value)}
                                                required={field.is_required} />
                                        )}
                                        {field.field_type === 'select' && (
                                            <Select value={formData.custom_fields[field.id] || ''}
                                                onValueChange={(v) => setCustomField(field.id, v)}>
                                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                <SelectContent>
                                                    {(field.options || []).map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {field.field_type === 'checkbox' && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <Checkbox checked={!!formData.custom_fields[field.id]}
                                                    onCheckedChange={(v) => setCustomField(field.id, v)} />
                                                <span className="text-sm text-slate-600">Sim</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Observações */}
                <Card className="dashboard-card mb-6">
                    <CardHeader><CardTitle className="font-heading">Observações</CardTitle></CardHeader>
                    <CardContent>
                        <textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)}
                            placeholder="Observações sobre o membro..."
                            className="w-full h-24 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                            data-testid="member-notes-input" />
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-12" disabled={submitting} data-testid="save-member-btn">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Salvar Alterações' : 'Cadastrar Membro'}
                </Button>
            </form>
        </div>
    );
}
