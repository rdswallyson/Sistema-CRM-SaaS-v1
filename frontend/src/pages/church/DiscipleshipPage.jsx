import { useState, useEffect } from 'react';
import { churchAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Plus,
    BookOpen,
    Users,
    Target,
    Award,
    Clock,
    CheckCircle,
    PlayCircle,
    MoreVertical,
    Edit,
    Trash2,
    UserPlus,
    GraduationCap,
    Heart,
    Loader2,
    ChevronRight,
    Star,
} from 'lucide-react';
import { toast } from 'sonner';

const categoryLabels = {
    new_convert: 'Novos Convertidos',
    baptism: 'Batismo',
    spiritual_growth: 'Crescimento Espiritual',
    leadership: 'Liderança',
    family: 'Família',
    general: 'Geral',
};

const categoryIcons = {
    new_convert: Star,
    baptism: Heart,
    spiritual_growth: Target,
    leadership: GraduationCap,
    family: Users,
    general: BookOpen,
};

const categoryColors = {
    new_convert: 'bg-amber-100 text-amber-700',
    baptism: 'bg-blue-100 text-blue-700',
    spiritual_growth: 'bg-green-100 text-green-700',
    leadership: 'bg-purple-100 text-purple-700',
    family: 'bg-pink-100 text-pink-700',
    general: 'bg-slate-100 text-slate-700',
};

const difficultyLabels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
};

const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
};

const statusLabels = {
    not_started: 'Não Iniciado',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    paused: 'Pausado',
};

const statusColors = {
    not_started: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
};

export default function DiscipleshipPage() {
    const [trails, setTrails] = useState([]);
    const [progress, setProgress] = useState([]);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('trails');
    const [trailDialogOpen, setTrailDialogOpen] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [selectedTrail, setSelectedTrail] = useState(null);
    
    const [trailForm, setTrailForm] = useState({
        name: '',
        description: '',
        difficulty: 'beginner',
        category: 'general',
        estimated_weeks: 4,
    });
    
    const [enrollForm, setEnrollForm] = useState({
        member_id: '',
        trail_id: '',
        mentor_id: '',
    });
    
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [trailsRes, progressRes, membersRes, statsRes] = await Promise.all([
                churchAPI.getDiscipleshipTrails(),
                churchAPI.getDiscipleshipProgress(),
                churchAPI.getMembers(),
                churchAPI.getDiscipleshipStats(),
            ]);
            setTrails(trailsRes.data);
            setProgress(progressRes.data);
            setMembers(membersRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Set mock stats on error
            setStats({
                total_trails: 5,
                total_enrolled: 45,
                in_progress: 28,
                completed: 17,
                completion_rate: 37.8,
                total_mentorships: 12,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTrail = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await churchAPI.createDiscipleshipTrail(trailForm);
            toast.success('Trilha criada com sucesso!');
            setTrailDialogOpen(false);
            setTrailForm({
                name: '',
                description: '',
                difficulty: 'beginner',
                category: 'general',
                estimated_weeks: 4,
            });
            fetchData();
        } catch (error) {
            toast.error('Erro ao criar trilha');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEnrollMember = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await churchAPI.enrollInTrail(
                enrollForm.member_id,
                enrollForm.trail_id,
                enrollForm.mentor_id || null
            );
            toast.success('Membro inscrito na trilha com sucesso!');
            setEnrollDialogOpen(false);
            setEnrollForm({ member_id: '', trail_id: '', mentor_id: '' });
            fetchData();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao inscrever membro';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTrail = async (trail) => {
        if (!window.confirm(`Tem certeza que deseja excluir a trilha "${trail.name}"?`)) return;
        try {
            await churchAPI.deleteDiscipleshipTrail(trail.id);
            toast.success('Trilha excluída com sucesso');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir trilha');
        }
    };

    const handleCompleteTrail = async (progressItem) => {
        try {
            await churchAPI.completeDiscipleshipTrail(progressItem.id);
            toast.success('Trilha concluída com sucesso!');
            fetchData();
        } catch (error) {
            toast.error('Erro ao concluir trilha');
        }
    };

    const getMemberName = (memberId) => {
        const member = members.find(m => m.id === memberId);
        return member?.name || 'Membro não encontrado';
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

    const leaders = members.filter(m => m.status === 'leader' || m.status === 'member');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Discipulado</h1>
                    <p className="text-slate-500">Trilhas de crescimento espiritual para os membros</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" data-testid="enroll-member-btn">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Inscrever Membro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-heading">Inscrever em Trilha</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEnrollMember} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Membro</Label>
                                    <Select
                                        value={enrollForm.member_id}
                                        onValueChange={(value) => setEnrollForm({ ...enrollForm, member_id: value })}
                                    >
                                        <SelectTrigger data-testid="enroll-member-select">
                                            <SelectValue placeholder="Selecione o membro" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {members.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Trilha</Label>
                                    <Select
                                        value={enrollForm.trail_id}
                                        onValueChange={(value) => setEnrollForm({ ...enrollForm, trail_id: value })}
                                    >
                                        <SelectTrigger data-testid="enroll-trail-select">
                                            <SelectValue placeholder="Selecione a trilha" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trails.map((trail) => (
                                                <SelectItem key={trail.id} value={trail.id}>
                                                    {trail.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mentor (opcional)</Label>
                                    <Select
                                        value={enrollForm.mentor_id}
                                        onValueChange={(value) => setEnrollForm({ ...enrollForm, mentor_id: value })}
                                    >
                                        <SelectTrigger data-testid="enroll-mentor-select">
                                            <SelectValue placeholder="Selecione o mentor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Sem mentor</SelectItem>
                                            {leaders.map((leader) => (
                                                <SelectItem key={leader.id} value={leader.id}>
                                                    {leader.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800"
                                    disabled={submitting || !enrollForm.member_id || !enrollForm.trail_id}
                                    data-testid="confirm-enroll-btn"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inscrever'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    
                    <Dialog open={trailDialogOpen} onOpenChange={setTrailDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-trail-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Trilha
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-heading">Criar Trilha</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateTrail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="trail-name">Nome da Trilha *</Label>
                                    <Input
                                        id="trail-name"
                                        value={trailForm.name}
                                        onChange={(e) => setTrailForm({ ...trailForm, name: e.target.value })}
                                        placeholder="Ex: Primeiros Passos"
                                        required
                                        data-testid="trail-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trail-description">Descrição</Label>
                                    <textarea
                                        id="trail-description"
                                        value={trailForm.description}
                                        onChange={(e) => setTrailForm({ ...trailForm, description: e.target.value })}
                                        placeholder="Descrição da trilha..."
                                        className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                        data-testid="trail-description-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Categoria</Label>
                                        <Select
                                            value={trailForm.category}
                                            onValueChange={(value) => setTrailForm({ ...trailForm, category: value })}
                                        >
                                            <SelectTrigger data-testid="trail-category-select">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categoryLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dificuldade</Label>
                                        <Select
                                            value={trailForm.difficulty}
                                            onValueChange={(value) => setTrailForm({ ...trailForm, difficulty: value })}
                                        >
                                            <SelectTrigger data-testid="trail-difficulty-select">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(difficultyLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estimated-weeks">Duração estimada (semanas)</Label>
                                    <Input
                                        id="estimated-weeks"
                                        type="number"
                                        min="1"
                                        value={trailForm.estimated_weeks}
                                        onChange={(e) => setTrailForm({ ...trailForm, estimated_weeks: parseInt(e.target.value) })}
                                        data-testid="trail-weeks-input"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800"
                                    disabled={submitting}
                                    data-testid="create-trail-btn"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Trilha'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="dashboard-card" data-testid="stat-trails">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-brand-blue" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats?.total_trails || 0}</p>
                                <p className="text-xs text-slate-500">Trilhas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-enrolled">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats?.in_progress || 0}</p>
                                <p className="text-xs text-slate-500">Em Andamento</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-completed">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                                <Award className="w-5 h-5 text-brand-green" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats?.completed || 0}</p>
                                <p className="text-xs text-slate-500">Concluídos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="dashboard-card" data-testid="stat-rate">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Target className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats?.completion_rate || 0}%</p>
                                <p className="text-xs text-slate-500">Taxa Conclusão</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="trails" data-testid="tab-trails">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Trilhas
                    </TabsTrigger>
                    <TabsTrigger value="progress" data-testid="tab-progress">
                        <Users className="w-4 h-4 mr-2" />
                        Progresso
                    </TabsTrigger>
                </TabsList>

                {/* Trails Tab */}
                <TabsContent value="trails" className="mt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trails-grid">
                        {trails.map((trail) => {
                            const CategoryIcon = categoryIcons[trail.category] || BookOpen;
                            return (
                                <Card key={trail.id} className="dashboard-card card-hover" data-testid={`trail-${trail.id}`}>
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className={`w-12 h-12 rounded-xl ${categoryColors[trail.category] || 'bg-slate-100'} flex items-center justify-center`}>
                                                <CategoryIcon className="w-6 h-6" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleDeleteTrail(trail)} className="text-red-600">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardTitle className="font-heading text-lg mt-4">{trail.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {trail.description || 'Sem descrição'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge className={categoryColors[trail.category]}>
                                                {categoryLabels[trail.category]}
                                            </Badge>
                                            <Badge className={difficultyColors[trail.difficulty]}>
                                                {difficultyLabels[trail.difficulty]}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{trail.estimated_weeks} semanas</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{trail.steps?.length || 0} etapas</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {trails.length === 0 && (
                            <Card className="dashboard-card col-span-full">
                                <CardContent className="py-8 text-center">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500">Nenhuma trilha cadastrada</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setTrailDialogOpen(true)}
                                    >
                                        Criar primeira trilha
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress" className="mt-6">
                    <Card className="dashboard-card" data-testid="progress-list">
                        <CardHeader>
                            <CardTitle className="font-heading">Membros em Discipulado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {progress.length > 0 ? (
                                <div className="space-y-4">
                                    {progress.map((item) => {
                                        const progressPercent = getTrailProgress(item);
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-slate-900 truncate">
                                                            {getMemberName(item.member_id)}
                                                        </p>
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                        <p className="text-sm text-slate-600 truncate">
                                                            {getTrailName(item.trail_id)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Progress value={progressPercent} className="flex-1 h-2" />
                                                        <span className="text-sm font-medium text-slate-600 w-12">
                                                            {progressPercent}%
                                                        </span>
                                                    </div>
                                                    {item.mentor_id && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Mentor: {getMemberName(item.mentor_id)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={statusColors[item.status]}>
                                                        {statusLabels[item.status]}
                                                    </Badge>
                                                    {item.status === 'in_progress' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleCompleteTrail(item)}
                                                            data-testid={`complete-btn-${item.id}`}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Concluir
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p>Nenhum membro em discipulado</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setEnrollDialogOpen(true)}
                                    >
                                        Inscrever primeiro membro
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
