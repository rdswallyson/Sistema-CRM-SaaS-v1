import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '../../../components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../components/ui/select';
import { Plus, Edit, Trash2, Loader2, Layers, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const fieldTypeLabels = {
    text: 'Texto', number: 'Número', date: 'Data', select: 'Seleção', checkbox: 'Checkbox',
};

export default function CustomFieldsPage() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '', field_type: 'text', options: [], is_required: false, is_active: true, order: 0,
    });
    const [optionInput, setOptionInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchFields(); }, []);

    const fetchFields = async () => {
        try {
            const res = await churchAPI.getCustomFields();
            setFields(res.data || []);
        } catch (e) { toast.error('Erro ao carregar campos'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            if (editing) {
                await churchAPI.updateCustomField(editing.id, formData);
                toast.success('Campo atualizado!');
            } else {
                await churchAPI.createCustomField(formData);
                toast.success('Campo criado!');
            }
            setDialogOpen(false);
            resetForm();
            fetchFields();
        } catch (e) { toast.error('Erro ao salvar campo'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = (field) => {
        setEditing(field);
        setFormData({
            name: field.name, field_type: field.field_type, options: field.options || [],
            is_required: field.is_required, is_active: field.is_active, order: field.order || 0,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (field) => {
        if (!window.confirm(`Excluir campo "${field.name}"?`)) return;
        try {
            await churchAPI.deleteCustomField(field.id);
            toast.success('Campo excluído');
            fetchFields();
        } catch (e) { toast.error('Erro ao excluir'); }
    };

    const toggleActive = async (field) => {
        try {
            await churchAPI.updateCustomField(field.id, { is_active: !field.is_active });
            fetchFields();
        } catch (e) { toast.error('Erro ao atualizar'); }
    };

    const addOption = () => {
        if (!optionInput.trim()) return;
        setFormData(prev => ({ ...prev, options: [...prev.options, optionInput.trim()] }));
        setOptionInput('');
    };

    const removeOption = (idx) => {
        setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
    };

    const resetForm = () => {
        setEditing(null);
        setFormData({ name: '', field_type: 'text', options: [], is_required: false, is_active: true, order: 0 });
        setOptionInput('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-slate-900">Campos Adicionais</h1>
                    <p className="text-slate-500">Crie campos personalizados para o cadastro de membros</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800" data-testid="add-field-btn">
                            <Plus className="w-4 h-4 mr-2" /> Novo Campo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Editar Campo' : 'Criar Campo'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Campo *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Profissão anterior" required data-testid="field-name-input" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={formData.field_type} onValueChange={(v) => setFormData({ ...formData, field_type: v })}>
                                    <SelectTrigger data-testid="field-type-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(fieldTypeLabels).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.field_type === 'select' && (
                                <div className="space-y-2">
                                    <Label>Opções</Label>
                                    <div className="flex gap-2">
                                        <Input value={optionInput} onChange={(e) => setOptionInput(e.target.value)}
                                            placeholder="Adicionar opção" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); }}} />
                                        <Button type="button" variant="outline" onClick={addOption}>+</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.options.map((opt, i) => (
                                            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeOption(i)}>
                                                {opt} ×
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <Label>Campo obrigatório</Label>
                                <Switch checked={formData.is_required}
                                    onCheckedChange={(v) => setFormData({ ...formData, is_required: v })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ordem de exibição</Label>
                                <Input type="number" value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
                            </div>
                            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="save-field-btn">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editing ? 'Salvar Alterações' : 'Criar Campo')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="dashboard-card" data-testid="custom-fields-list">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Layers className="w-5 h-5" /> Campos ({fields.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
                    ) : fields.length > 0 ? (
                        <div className="space-y-3">
                            {fields.map(field => (
                                <div key={field.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${field.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <GripVertical className="w-4 h-4 text-slate-300" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900">{field.name}</p>
                                            <Badge variant="outline">{fieldTypeLabels[field.field_type]}</Badge>
                                            {field.is_required && <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>}
                                        </div>
                                        {field.options?.length > 0 && (
                                            <p className="text-xs text-slate-500 mt-1">Opções: {field.options.join(', ')}</p>
                                        )}
                                    </div>
                                    <Switch checked={field.is_active} onCheckedChange={() => toggleActive(field)} />
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(field)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(field)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Layers className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Nenhum campo adicional criado</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
