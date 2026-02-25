import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import {
    User,
    Bell,
    Shield,
    Palette,
    Save,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [notifications, setNotifications] = useState({
        email_donations: true,
        email_events: true,
        email_members: true,
        push_enabled: false,
    });
    const [churchSettings, setChurchSettings] = useState({
        name: 'Minha Igreja',
        primary_color: '#4ade80',
        secondary_color: '#3b82f6',
    });

    const handleSaveProfile = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success('Perfil atualizado com sucesso!');
        setSaving(false);
    };

    const handleSaveChurch = async () => {
        setSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success('Configurações da igreja atualizadas!');
        setSaving(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-heading text-2xl font-bold text-slate-900">Configurações</h1>
                <p className="text-slate-500">Gerencie suas preferências e configurações</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="dashboard-card" data-testid="profile-settings">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Perfil
                        </CardTitle>
                        <CardDescription>Suas informações pessoais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                data-testid="profile-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                data-testid="profile-email-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="(11) 99999-9999"
                                data-testid="profile-phone-input"
                            />
                        </div>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="w-full bg-slate-900 hover:bg-slate-800"
                            data-testid="save-profile-btn"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Perfil
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="dashboard-card" data-testid="notification-settings">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notificações
                        </CardTitle>
                        <CardDescription>Configure suas preferências de notificação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="cursor-pointer">Novas doações</Label>
                                <p className="text-xs text-slate-500">Receba alertas de novas doações</p>
                            </div>
                            <Switch
                                checked={notifications.email_donations}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, email_donations: checked })
                                }
                                data-testid="notif-donations-switch"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="cursor-pointer">Eventos</Label>
                                <p className="text-xs text-slate-500">Lembretes de eventos próximos</p>
                            </div>
                            <Switch
                                checked={notifications.email_events}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, email_events: checked })
                                }
                                data-testid="notif-events-switch"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="cursor-pointer">Novos membros</Label>
                                <p className="text-xs text-slate-500">Alertas de novos cadastros</p>
                            </div>
                            <Switch
                                checked={notifications.email_members}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, email_members: checked })
                                }
                                data-testid="notif-members-switch"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="cursor-pointer">Notificações Push</Label>
                                <p className="text-xs text-slate-500">Receba alertas no navegador</p>
                            </div>
                            <Switch
                                checked={notifications.push_enabled}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, push_enabled: checked })
                                }
                                data-testid="notif-push-switch"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Church Customization */}
                <Card className="dashboard-card" data-testid="church-settings">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Personalização da Igreja
                        </CardTitle>
                        <CardDescription>Customize a aparência do seu painel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="church_name">Nome da Igreja</Label>
                            <Input
                                id="church_name"
                                value={churchSettings.name}
                                onChange={(e) => setChurchSettings({ ...churchSettings, name: e.target.value })}
                                data-testid="church-name-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primary_color">Cor Primária</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primary_color"
                                        type="color"
                                        value={churchSettings.primary_color}
                                        onChange={(e) =>
                                            setChurchSettings({ ...churchSettings, primary_color: e.target.value })
                                        }
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        data-testid="primary-color-input"
                                    />
                                    <Input
                                        value={churchSettings.primary_color}
                                        onChange={(e) =>
                                            setChurchSettings({ ...churchSettings, primary_color: e.target.value })
                                        }
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secondary_color">Cor Secundária</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondary_color"
                                        type="color"
                                        value={churchSettings.secondary_color}
                                        onChange={(e) =>
                                            setChurchSettings({ ...churchSettings, secondary_color: e.target.value })
                                        }
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        data-testid="secondary-color-input"
                                    />
                                    <Input
                                        value={churchSettings.secondary_color}
                                        onChange={(e) =>
                                            setChurchSettings({ ...churchSettings, secondary_color: e.target.value })
                                        }
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveChurch}
                            disabled={saving}
                            className="w-full bg-slate-900 hover:bg-slate-800"
                            data-testid="save-church-btn"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Configurações
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="dashboard-card" data-testid="security-settings">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Segurança
                        </CardTitle>
                        <CardDescription>Gerencie sua senha e segurança</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_password">Senha Atual</Label>
                            <Input
                                id="current_password"
                                type="password"
                                placeholder="••••••••"
                                data-testid="current-password-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Nova Senha</Label>
                            <Input
                                id="new_password"
                                type="password"
                                placeholder="••••••••"
                                data-testid="new-password-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                placeholder="••••••••"
                                data-testid="confirm-password-input"
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            data-testid="change-password-btn"
                        >
                            Alterar Senha
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
