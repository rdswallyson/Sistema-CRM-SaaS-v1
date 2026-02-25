import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { churchAPI } from '../../lib/api';
import { 
    formatDate, 
    formatCurrency, 
    memberStatusLabels, 
    memberStatusColors,
    donationTypeLabels,
    donationTypeColors 
} from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Heart,
    Church,
    DollarSign,
    BookOpen,
    Award,
    Users,
    Star,
    Clock,
    Edit,
    Save,
    Loader2,
    CheckCircle,
    AlertCircle,
    Gift,
    CalendarCheck,
    GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MemberProfilePage() {
    const { memberId } = useParams();
    const navigate = useNavigate();
    
    const [member, setMember] = useState(null);
    const [ministries, setMinistries] = useState([]);
    const [events, setEvents] = useState([]);
    const [donations, setDonations] = useState([]);
    const [trails, setTrails] = useState([]);
    const [progress, setProgress] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchMemberData();
    }, [memberId]);

    const fetchMemberData = async () => {
        try {
            const [memberRes, ministriesRes, eventsRes, donationsRes, trailsRes, progressRes] = await Promise.all([
                churchAPI.getMember(memberId),
                churchAPI.getMinistries(),
                churchAPI.getEvents(),
                churchAPI.getDonations(),
                churchAPI.getDiscipleshipTrails(),
                churchAPI.getMemberProgress(memberId),
            ]);
            
            setMember(memberRes.data);
            setFormData(memberRes.data);
            setMinistries(ministriesRes.data);
            setEvents(eventsRes.data);
            setTrails(trailsRes.data);
            setProgress(progressRes.data);
            
            // Filter donations for this member
            const memberDonations = donationsRes.data.filter(
                d => d.member_id === memberId || d.member_name === memberRes.data.name
            );
            setDonations(memberDonations);
            
        } catch (error) {
            console.error('Error fetching member data:', error);
            toast.error('Erro ao carregar dados do membro');
            navigate('/dashboard/members');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await churchAPI.updateMember(memberId, formData);
            setMember(formData);
            setEditing(false);
            toast.success('Membro atualizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const getTrailName = (trailId) => {
        const trail = trails.find(t => t.id === trailId);
        return trail?.name || 'Trilha não encontrada';
    };

    const getTrailProgress = (progressItem) => {
        const trail = trails.find(t => t.id === progressItem.trail_id);
        if (!trail || !trail.steps || trail.steps.length === 0) return 0;
        return Math.round((progressItem.completed_steps?.length || 0) / trail.steps.length * 100);
    };

    const getMemberMinistries = () => {
        if (!member?.ministry_ids || member.ministry_ids.length === 0) return [];
        return ministries.filter(m => member.ministry_ids.includes(m.id));
    };

    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const memberMinistries = getMemberMinistries();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-sky" />
            </div>
        );
    }

    if (!member) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-500">Membro não encontrado</p>
                <Link to="/dashboard/members">
                    <Button variant="outline" className="mt-4">Voltar para Membros</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/members')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
            </div>

            {/* Profile Header Card */}
            <Card className="dashboard-card overflow-hidden" data-testid="member-profile-header">
                <div className="h-24 bg-gradient-to-r from-brand-sky to-brand-blue"></div>
                <CardContent className="relative pt-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                        <div className="w-24 h-24 rounded-xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                            <User className="w-12 h-12 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <h1 className="font-heading text-2xl font-bold text-slate-900">
                                    {member.name}
                                </h1>
                                <Badge className={memberStatusColors[member.status]}>
                                    {memberStatusLabels[member.status]}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                {member.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" /> {member.email}
                                    </span>
                                )}
                                {member.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" /> {member.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button 
                            onClick={() => setEditing(!editing)}
                            variant={editing ? "default" : "outline"}
                            data-testid="edit-member-btn"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            {editing ? 'Cancelar' : 'Editar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card" data-testid="stat-ministries">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Church className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{memberMinistries.length}</p>
                                <p className="text-xs text-slate-500">Ministérios</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-donations">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-sky/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-brand-sky" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalDonations)}</p>
                                <p className="text-xs text-slate-500">Total Doações</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-trails">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-brand-blue" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{progress.length}</p>
                                <p className="text-xs text-slate-500">Trilhas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-badges">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Award className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {progress.filter(p => p.status === 'completed').length}
                                </p>
                                <p className="text-xs text-slate-500">Certificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                    <TabsTrigger value="overview" data-testid="tab-overview">
                        <User className="w-4 h-4 mr-2" />
                        Dados
                    </TabsTrigger>
                    <TabsTrigger value="ministries" data-testid="tab-ministries">
                        <Church className="w-4 h-4 mr-2" />
                        Ministérios
                    </TabsTrigger>
                    <TabsTrigger value="financial" data-testid="tab-financial">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="discipleship" data-testid="tab-discipleship">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Discipulado
                    </TabsTrigger>
                    <TabsTrigger value="spiritual" data-testid="tab-spiritual">
                        <Heart className="w-4 h-4 mr-2" />
                        Espiritual
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                    <Card className="dashboard-card" data-testid="member-details">
                        <CardHeader>
                            <CardTitle className="font-heading">Informações Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {editing ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome Completo</Label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            data-testid="edit-name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            data-testid="edit-email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            data-testid="edit-phone"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data de Nascimento</Label>
                                        <Input
                                            type="date"
                                            value={formData.birth_date || ''}
                                            onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                            data-testid="edit-birth"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Endereço</Label>
                                        <Input
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            data-testid="edit-address"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({...formData, status: value})}
                                        >
                                            <SelectTrigger data-testid="edit-status">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visitor">Visitante</SelectItem>
                                                <SelectItem value="new_convert">Novo Convertido</SelectItem>
                                                <SelectItem value="member">Membro</SelectItem>
                                                <SelectItem value="leader">Líder</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Observações</Label>
                                        <textarea
                                            value={formData.notes || ''}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            className="w-full h-24 px-3 py-2 border rounded-lg resize-none"
                                            data-testid="edit-notes"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Button 
                                            onClick={handleSave} 
                                            disabled={saving}
                                            className="bg-slate-900 hover:bg-slate-800"
                                            data-testid="save-member-btn"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Email</p>
                                                <p className="font-medium">{member.email || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Telefone</p>
                                                <p className="font-medium">{member.phone || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Endereço</p>
                                                <p className="font-medium">{member.address || 'Não informado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Data de Nascimento</p>
                                                <p className="font-medium">{member.birth_date ? formatDate(member.birth_date) : 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Membro desde</p>
                                                <p className="font-medium">{formatDate(member.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {member.notes && (
                                        <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 mb-1">Observações</p>
                                            <p className="text-slate-700">{member.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ministries Tab */}
                <TabsContent value="ministries" className="mt-6">
                    <Card className="dashboard-card" data-testid="member-ministries">
                        <CardHeader>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <Church className="w-5 h-5" />
                                Ministérios Participantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {memberMinistries.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {memberMinistries.map((ministry) => (
                                        <div
                                            key={ministry.id}
                                            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <Church className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{ministry.name}</p>
                                                    <p className="text-sm text-slate-500">{ministry.description}</p>
                                                    {ministry.meeting_schedule && (
                                                        <Badge variant="outline" className="mt-2">
                                                            {ministry.meeting_schedule}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Church className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Não participa de nenhum ministério</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="mt-6">
                    <Card className="dashboard-card" data-testid="member-financial">
                        <CardHeader>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Histórico Financeiro
                            </CardTitle>
                            <CardDescription>
                                Total contribuído: {formatCurrency(totalDonations)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {donations.length > 0 ? (
                                <div className="space-y-3">
                                    {donations.map((donation, index) => (
                                        <div
                                            key={donation.id || index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-brand-sky/10 flex items-center justify-center">
                                                    <Gift className="w-5 h-5 text-brand-sky" />
                                                </div>
                                                <div>
                                                    <Badge className={donationTypeColors[donation.donation_type]}>
                                                        {donationTypeLabels[donation.donation_type]}
                                                    </Badge>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {formatDate(donation.donation_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-slate-900">
                                                {formatCurrency(donation.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Nenhuma doação registrada</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Discipleship Tab */}
                <TabsContent value="discipleship" className="mt-6">
                    <Card className="dashboard-card" data-testid="member-discipleship">
                        <CardHeader>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Jornada de Discipulado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {progress.length > 0 ? (
                                <div className="space-y-4">
                                    {progress.map((item) => {
                                        const progressPercent = getTrailProgress(item);
                                        const isCompleted = item.status === 'completed';
                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-4 rounded-xl ${isCompleted ? 'bg-brand-sky/5 border border-brand-sky/20' : 'bg-slate-50'}`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-brand-sky/20' : 'bg-brand-blue/10'}`}>
                                                            {isCompleted ? (
                                                                <Award className="w-5 h-5 text-brand-sky" />
                                                            ) : (
                                                                <BookOpen className="w-5 h-5 text-brand-blue" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {getTrailName(item.trail_id)}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {isCompleted ? 'Concluído em ' + formatDate(item.completed_at) : 'Iniciado em ' + formatDate(item.started_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isCompleted && (
                                                        <Badge className="bg-brand-sky/10 text-brand-sky-active">
                                                            <Award className="w-3 h-3 mr-1" />
                                                            Certificado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Progress value={progressPercent} className="flex-1 h-2" />
                                                    <span className="text-sm font-medium text-slate-600 w-12">
                                                        {progressPercent}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Não está inscrito em nenhuma trilha</p>
                                    <Link to="/dashboard/discipleship">
                                        <Button variant="outline" className="mt-4">
                                            Ver Trilhas Disponíveis
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Spiritual Tab */}
                <TabsContent value="spiritual" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="dashboard-card" data-testid="member-spiritual">
                            <CardHeader>
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <Heart className="w-5 h-5" />
                                    Histórico Espiritual
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Star className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Data de Conversão</p>
                                        <p className="font-medium">
                                            {member.conversion_date ? formatDate(member.conversion_date) : 'Não informado'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Data de Batismo</p>
                                        <p className="font-medium">
                                            {member.baptism_date ? formatDate(member.baptism_date) : 'Não batizado'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Trilhas Concluídas</p>
                                        <p className="font-medium">
                                            {progress.filter(p => p.status === 'completed').length} trilhas
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="dashboard-card">
                            <CardHeader>
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Certificados e Conquistas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {progress.filter(p => p.status === 'completed').length > 0 ? (
                                    <div className="space-y-3">
                                        {progress.filter(p => p.status === 'completed').map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-brand-sky/5 border border-brand-sky/20"
                                            >
                                                <Award className="w-8 h-8 text-brand-sky" />
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {getTrailName(item.trail_id)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Concluído em {formatDate(item.completed_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Award className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                        <p>Nenhum certificado ainda</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
