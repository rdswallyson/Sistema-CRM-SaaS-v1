import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { churchAPI } from '../../lib/api';
import { memberStatusLabels, memberStatusColors, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
    Search,
    MoreVertical,
    Users,
    Edit,
    Trash2,
    Phone,
    Mail,
    Loader2,
    UserPlus,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MembersPage() {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        status: 'visitor',
        baptism_date: '',
        conversion_date: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await churchAPI.getMembers();
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingMember) {
                await churchAPI.updateMember(editingMember.id, formData);
                toast.success('Membro atualizado com sucesso!');
            } else {
                await churchAPI.createMember(formData);
                toast.success('Membro cadastrado com sucesso!');
            }
            setDialogOpen(false);
            resetForm();
            fetchMembers();
        } catch (error) {
            const message = error.response?.data?.detail || 'Erro ao salvar membro';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name || '',
            email: member.email || '',
            phone: member.phone || '',
            address: member.address || '',
            birth_date: member.birth_date || '',
            status: member.status || 'visitor',
            baptism_date: member.baptism_date || '',
            conversion_date: member.conversion_date || '',
            notes: member.notes || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (member) => {
        if (!window.confirm(`Tem certeza que deseja excluir "${member.name}"?`)) return;

        try {
            await churchAPI.deleteMember(member.id);
            toast.success('Membro excluído com sucesso');
            fetchMembers();
        } catch (error) {
            toast.error('Erro ao excluir membro');
        }
    };

    const resetForm = () => {
        setEditingMember(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            birth_date: '',
            status: 'visitor',
            baptism_date: '',
            conversion_date: '',
            notes: '',
        });
    };

    const filteredMembers = members.filter((m) => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Gestão de Membros</h1>
                    <p className="text-slate-500">Gerencie os membros da sua igreja</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-member-btn">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Novo Membro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-heading">
                                {editingMember ? 'Editar Membro' : 'Cadastrar Membro'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="João da Silva"
                                        required
                                        data-testid="member-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="joao@email.com"
                                        data-testid="member-email-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(11) 99999-9999"
                                        data-testid="member-phone-input"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="address">Endereço</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Rua, número, bairro"
                                        data-testid="member-address-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                        data-testid="member-birth-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger data-testid="member-status-select">
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
                                <div className="space-y-2">
                                    <Label htmlFor="baptism_date">Data de Batismo</Label>
                                    <Input
                                        id="baptism_date"
                                        type="date"
                                        value={formData.baptism_date}
                                        onChange={(e) => setFormData({ ...formData, baptism_date: e.target.value })}
                                        data-testid="member-baptism-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="conversion_date">Data de Conversão</Label>
                                    <Input
                                        id="conversion_date"
                                        type="date"
                                        value={formData.conversion_date}
                                        onChange={(e) => setFormData({ ...formData, conversion_date: e.target.value })}
                                        data-testid="member-conversion-input"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="notes">Observações</Label>
                                    <textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Observações sobre o membro..."
                                        className="w-full h-20 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                                        data-testid="member-notes-input"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800"
                                disabled={submitting}
                                data-testid="save-member-btn"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    editingMember ? 'Salvar Alterações' : 'Cadastrar Membro'
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card className="dashboard-card">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar membro..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                data-testid="search-members-input"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="visitor">Visitantes</SelectItem>
                                <SelectItem value="new_convert">Novos Convertidos</SelectItem>
                                <SelectItem value="member">Membros</SelectItem>
                                <SelectItem value="leader">Líderes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Members List */}
            <Card className="dashboard-card" data-testid="members-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Membros ({filteredMembers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Nome</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm hidden md:table-cell">Contato</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                                        <th className="text-right py-3 px-4 font-medium text-slate-500 text-sm">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{member.name}</p>
                                                    {member.birth_date && (
                                                        <p className="text-sm text-slate-500">
                                                            Nasc: {formatDate(member.birth_date)}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <div className="space-y-1">
                                                    {member.email && (
                                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                                            <Mail className="w-3 h-3" />
                                                            {member.email}
                                                        </div>
                                                    )}
                                                    {member.phone && (
                                                        <div className="flex items-center gap-1 text-sm text-slate-600">
                                                            <Phone className="w-3 h-3" />
                                                            {member.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge className={memberStatusColors[member.status]}>
                                                    {memberStatusLabels[member.status]}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" data-testid={`member-menu-${member.id}`}>
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(member)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum membro encontrado</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
