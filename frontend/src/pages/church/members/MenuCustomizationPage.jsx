import { useState, useEffect } from 'react';
import { churchAPI } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Pencil, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const defaultMenuItems = [
    { menu_key: 'members_main', display_name: 'Membros' },
    { menu_key: 'members_list', display_name: 'Ver todos' },
    { menu_key: 'members_add', display_name: 'Adicionar membro' },
    { menu_key: 'members_custom_fields', display_name: 'Campos adicionais' },
    { menu_key: 'members_categories', display_name: 'Categorias' },
    { menu_key: 'members_positions', display_name: 'Cargos' },
    { menu_key: 'members_card', display_name: 'Cartão do membro' },
    { menu_key: 'members_birthdays', display_name: 'Aniversariantes' },
    { menu_key: 'members_reports', display_name: 'Relatórios' },
    { menu_key: 'members_menu_edit', display_name: 'Editar nomes do menu' },
];

export default function MenuCustomizationPage() {
    const [menuItems, setMenuItems] = useState(defaultMenuItems.map(i => ({ ...i })));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await churchAPI.getMenuCustomization();
                const saved = res.data || [];
                const merged = defaultMenuItems.map(def => {
                    const found = saved.find(s => s.menu_key === def.menu_key);
                    return { menu_key: def.menu_key, display_name: found ? found.display_name : def.display_name };
                });
                setMenuItems(merged);
            } catch (e) {}
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleChange = (index, value) => {
        setMenuItems(prev => prev.map((item, i) => i === index ? { ...item, display_name: value } : item));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await churchAPI.updateMenuCustomization(menuItems);
            toast.success('Nomes do menu atualizados! Recarregue a página para ver as mudanças.');
        } catch (e) { toast.error('Erro ao salvar'); }
        finally { setSaving(false); }
    };

    const handleReset = () => {
        setMenuItems(defaultMenuItems.map(i => ({ ...i })));
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-sky" /></div>
    );

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Personalização do Menu</h1>
                <p className="text-slate-500">Altere os nomes exibidos no menu de Membros</p>
            </div>

            <Card className="dashboard-card" data-testid="menu-customization">
                <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                        <Pencil className="w-5 h-5" /> Nomes do Menu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {menuItems.map((item, index) => (
                            <div key={item.menu_key} className="flex items-center gap-4">
                                <div className="w-40 shrink-0">
                                    <p className="text-xs text-slate-400 font-mono">{item.menu_key}</p>
                                </div>
                                <Input
                                    value={item.display_name}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    className="flex-1"
                                    data-testid={`menu-input-${item.menu_key}`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800" disabled={saving} data-testid="save-menu-btn">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                        <Button variant="outline" onClick={handleReset} data-testid="reset-menu-btn">
                            Restaurar Padrão
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
