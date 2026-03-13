import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Building2, CreditCard, TrendingUp, Plus, Settings } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function MasterPanelDashboard() {
    const [stats, setStats] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch dashboard stats
            const statsResponse = await api.get("/api/master/dashboard/stats");
            setStats(statsResponse.data.data);

            // Fetch organizations
            const orgsResponse = await api.get("/api/master/organizacoes?limit=10");
            setOrganizations(orgsResponse.data.data);

            // Fetch plans
            const plansResponse = await api.get("/api/master/planos");
            setPlans(plansResponse.data.data);
        } catch (error) {
            toast.error("Erro ao carregar dados do painel");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel Master</h1>
                    <p className="text-gray-500 mt-2">Gerenciamento centralizado da plataforma SaaS</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Organizações Totais</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_organizations}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_organizations} ativas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
                            <p className="text-xs text-muted-foreground">
                                de {stats.total_subscriptions} total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                R$ {stats.estimated_monthly_revenue?.toFixed(2) || "0.00"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Estimada
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_organizations > 0 
                                    ? ((stats.active_organizations / stats.total_organizations) * 100).toFixed(1)
                                    : "0"
                                }%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                de organizações
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="organizations">Organizações</TabsTrigger>
                    <TabsTrigger value="plans">Planos</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Revenue Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição de Planos</CardTitle>
                                <CardDescription>
                                    Organizações por plano de assinatura
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {plans.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={plans}
                                                dataKey="preco_mensal"
                                                nameKey="nome"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label
                                            >
                                                {plans.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">Nenhum plano disponível</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Organizations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organizações Recentes</CardTitle>
                                <CardDescription>
                                    Últimas organizações cadastradas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {organizations.slice(0, 5).map((org) => (
                                        <div key={org.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                                <p className="font-medium">{org.nome}</p>
                                                <p className="text-sm text-gray-500">{org.slug}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {org.status === "ativa" ? "✓ Ativa" : "✗ Inativa"}
                                                </p>
                                                {org.assinatura_ativa && (
                                                    <p className="text-xs text-green-600">{org.plano_nome}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Organizations Tab */}
                <TabsContent value="organizations" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Gerenciar Organizações</h3>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Organização
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-4">Nome</th>
                                            <th className="text-left py-2 px-4">Slug</th>
                                            <th className="text-left py-2 px-4">Status</th>
                                            <th className="text-left py-2 px-4">Plano</th>
                                            <th className="text-left py-2 px-4">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organizations.map((org) => (
                                            <tr key={org.id} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-4">{org.nome}</td>
                                                <td className="py-2 px-4">{org.slug}</td>
                                                <td className="py-2 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        org.status === "ativa" 
                                                            ? "bg-green-100 text-green-800" 
                                                            : "bg-red-100 text-red-800"
                                                    }`}>
                                                        {org.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4">
                                                    {org.plano_nome || "Sem assinatura"}
                                                </td>
                                                <td className="py-2 px-4">
                                                    <Button variant="ghost" size="sm">
                                                        Editar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Plans Tab */}
                <TabsContent value="plans" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Gerenciar Planos</h3>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Plano
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <Card key={plan.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{plan.nome}</CardTitle>
                                    <CardDescription>{plan.descricao}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-bold">
                                            R$ {plan.preco_mensal?.toFixed(2) || "0.00"}
                                        </p>
                                        <p className="text-sm text-gray-500">/mês</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Funcionalidades:</p>
                                        <ul className="text-sm space-y-1">
                                            {plan.modulo_financeiro && <li>✓ Módulo Financeiro</li>}
                                            {plan.modulo_patrimonio && <li>✓ Módulo Patrimônio</li>}
                                            {plan.modulo_ensino && <li>✓ Módulo Ensino</li>}
                                            {plan.modulo_grupos && <li>✓ Módulo Grupos</li>}
                                        </ul>
                                    </div>

                                    <Button variant="outline" className="w-full" size="sm">
                                        Editar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
