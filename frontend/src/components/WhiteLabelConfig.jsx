import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

export default function WhiteLabelConfig() {
    const [config, setConfig] = useState({
        nome_organizacao: "",
        logo_url: "",
        cor_primaria: "#3b82f6",
        cor_secundaria: "#10b981",
        cor_fundo: "#ffffff",
        fonte_primaria: "Inter",
        fonte_secundaria: "Poppins",
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchWhiteLabelConfig();
    }, []);

    const fetchWhiteLabelConfig = async () => {
        try {
            const response = await api.get("/api/church/white-label");
            if (response.data.data) {
                setConfig(response.data.data);
            }
        } catch (error) {
            console.error("Erro ao carregar configurações de White Label:", error);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.post("/api/church/white-label", config);
            toast.success("Configurações salvas com sucesso!");
            setSaved(true);
            // Reload page to apply new theme
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error("Erro ao salvar configurações");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">White Label</h2>
                <p className="text-gray-500 mt-2">Personalize a aparência da sua plataforma</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Visualização</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="p-6 rounded-lg text-white space-y-4"
                                style={{ 
                                    backgroundColor: config.cor_primaria,
                                    fontFamily: config.fonte_primaria
                                }}
                            >
                                {config.logo_url && (
                                    <img 
                                        src={config.logo_url} 
                                        alt="Logo" 
                                        className="h-12 object-contain"
                                    />
                                )}
                                <div>
                                    <h3 className="font-bold text-lg">{config.nome_organizacao || "Sua Organização"}</h3>
                                    <p className="text-sm opacity-90">Bem-vindo ao painel administrativo</p>
                                </div>
                                <div className="pt-4 space-y-2">
                                    <button 
                                        className="w-full py-2 rounded text-sm font-medium"
                                        style={{ 
                                            backgroundColor: config.cor_secundaria,
                                            color: "white"
                                        }}
                                    >
                                        Botão Primário
                                    </button>
                                    <button 
                                        className="w-full py-2 rounded text-sm font-medium border"
                                        style={{ 
                                            borderColor: "rgba(255,255,255,0.3)",
                                            color: "white"
                                        }}
                                    >
                                        Botão Secundário
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration Form */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                            <CardDescription>
                                Configure o nome e logo da sua organização
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="nome">Nome da Organização</Label>
                                <Input
                                    id="nome"
                                    value={config.nome_organizacao}
                                    onChange={(e) => handleChange("nome_organizacao", e.target.value)}
                                    placeholder="Ex: Minha Igreja"
                                />
                            </div>

                            <div>
                                <Label htmlFor="logo">URL do Logo</Label>
                                <Input
                                    id="logo"
                                    type="url"
                                    value={config.logo_url}
                                    onChange={(e) => handleChange("logo_url", e.target.value)}
                                    placeholder="https://exemplo.com/logo.png"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cores</CardTitle>
                            <CardDescription>
                                Personalize as cores da sua plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="cor-primaria">Cor Primária</Label>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            id="cor-primaria"
                                            type="color"
                                            value={config.cor_primaria}
                                            onChange={(e) => handleChange("cor_primaria", e.target.value)}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={config.cor_primaria}
                                            onChange={(e) => handleChange("cor_primaria", e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="cor-secundaria">Cor Secundária</Label>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            id="cor-secundaria"
                                            type="color"
                                            value={config.cor_secundaria}
                                            onChange={(e) => handleChange("cor_secundaria", e.target.value)}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={config.cor_secundaria}
                                            onChange={(e) => handleChange("cor_secundaria", e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="cor-fundo">Cor de Fundo</Label>
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            id="cor-fundo"
                                            type="color"
                                            value={config.cor_fundo}
                                            onChange={(e) => handleChange("cor_fundo", e.target.value)}
                                            className="w-12 h-10 rounded cursor-pointer"
                                        />
                                        <Input
                                            value={config.cor_fundo}
                                            onChange={(e) => handleChange("cor_fundo", e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tipografia</CardTitle>
                            <CardDescription>
                                Escolha as fontes da sua plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="fonte-primaria">Fonte Primária</Label>
                                    <select
                                        id="fonte-primaria"
                                        value={config.fonte_primaria}
                                        onChange={(e) => handleChange("fonte_primaria", e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option>Inter</option>
                                        <option>Poppins</option>
                                        <option>Roboto</option>
                                        <option>Open Sans</option>
                                        <option>Lato</option>
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="fonte-secundaria">Fonte Secundária</Label>
                                    <select
                                        id="fonte-secundaria"
                                        value={config.fonte_secundaria}
                                        onChange={(e) => handleChange("fonte_secundaria", e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option>Poppins</option>
                                        <option>Inter</option>
                                        <option>Roboto</option>
                                        <option>Open Sans</option>
                                        <option>Lato</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline">Cancelar</Button>
                        <Button 
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Salvando..." : "Salvar Configurações"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
