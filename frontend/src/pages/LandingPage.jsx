import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Church,
    Users,
    Calendar,
    DollarSign,
    MessageSquare,
    BarChart3,
    Shield,
    Zap,
    Check,
    ArrowRight,
    Star,
    Menu,
    X,
} from 'lucide-react';
import { publicAPI } from '../lib/api';
import { formatCurrency } from '../lib/utils';

const features = [
    {
        icon: Users,
        title: 'Gestão de Membros',
        description: 'Cadastro completo com histórico espiritual, famílias, batismo e discipulado.',
    },
    {
        icon: Church,
        title: 'Ministérios',
        description: 'Organize ministérios, defina líderes, metas e acompanhe o desempenho.',
    },
    {
        icon: Calendar,
        title: 'Eventos',
        description: 'Crie eventos pagos ou gratuitos com check-in via QR Code.',
    },
    {
        icon: DollarSign,
        title: 'Financeiro',
        description: 'Controle dízimos, ofertas, doações recorrentes e fluxo de caixa.',
    },
    {
        icon: MessageSquare,
        title: 'Comunicação',
        description: 'Envie mensagens por Email, SMS e WhatsApp de forma segmentada.',
    },
    {
        icon: BarChart3,
        title: 'Dashboard Inteligente',
        description: 'Métricas em tempo real, gráficos dinâmicos e alertas automáticos.',
    },
];

const testimonials = [
    {
        name: 'Pastor João Silva',
        church: 'Igreja Vida Nova',
        text: 'O Firmes na Fé transformou nossa gestão. Agora temos controle total de membros e finanças.',
        rating: 5,
    },
    {
        name: 'Líder Maria Santos',
        church: 'Comunidade Graça',
        text: 'A comunicação com os membros ficou muito mais fácil. O WhatsApp integrado é incrível!',
        rating: 5,
    },
    {
        name: 'Diácono Carlos',
        church: 'Igreja Batista Central',
        text: 'Os relatórios financeiros nos ajudaram a tomar decisões mais estratégicas.',
        rating: 5,
    },
];

const faqs = [
    {
        question: 'Posso testar antes de assinar?',
        answer: 'Sim! Oferecemos 30 dias de teste gratuito com acesso completo a todas as funcionalidades.',
    },
    {
        question: 'Como funciona o suporte?',
        answer: 'Oferecemos suporte via chat, email e WhatsApp. Planos superiores têm suporte prioritário.',
    },
    {
        question: 'Meus dados estão seguros?',
        answer: 'Sim! Utilizamos criptografia de ponta a ponta, backup diário e estamos em conformidade com a LGPD.',
    },
    {
        question: 'Posso migrar meus dados de outro sistema?',
        answer: 'Sim! Nossa equipe oferece suporte completo na migração de dados sem custo adicional.',
    },
];

export default function LandingPage() {
    const [plans, setPlans] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const response = await publicAPI.getPlans();
                setPlans(response.data);
            } catch (error) {
                // Use default plans if API fails
                setPlans([
                    { name: 'Essencial', type: 'essential', price_monthly: 97, member_limit: 100, features: ['Até 100 membros', 'Dashboard básico', 'Gestão de membros', 'Eventos', 'Relatórios básicos'] },
                    { name: 'Estratégico', type: 'strategic', price_monthly: 197, member_limit: 500, features: ['Até 500 membros', 'Dashboard completo', 'Todos os módulos', 'Comunicação SMS/Email', 'Relatórios avançados', 'Suporte prioritário'] },
                    { name: 'Apostólico', type: 'apostolic', price_monthly: 397, member_limit: 2000, features: ['Até 2000 membros', 'Dashboard inteligente', 'Todos os módulos', 'WhatsApp integrado', 'Automações', 'API access', 'White label'] },
                ]);
            }
        };
        loadPlans();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                                <Church className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-heading font-bold text-slate-900">Firmes</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Recursos</a>
                            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Planos</a>
                            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900">Depoimentos</a>
                            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900">FAQ</a>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" data-testid="login-nav-btn">Entrar</Button>
                            </Link>
                            <Link to="/register">
                                <Button className="bg-slate-900 hover:bg-slate-800" data-testid="register-nav-btn">
                                    Começar Grátis
                                </Button>
                            </Link>
                        </div>

                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            data-testid="mobile-menu-toggle"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 py-4">
                        <div className="max-w-7xl mx-auto px-4 space-y-3">
                            <a href="#features" className="block py-2 text-slate-600" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
                            <a href="#pricing" className="block py-2 text-slate-600" onClick={() => setMobileMenuOpen(false)}>Planos</a>
                            <a href="#testimonials" className="block py-2 text-slate-600" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
                            <a href="#faq" className="block py-2 text-slate-600" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                            <div className="pt-3 flex flex-col gap-2">
                                <Link to="/login"><Button variant="outline" className="w-full">Entrar</Button></Link>
                                <Link to="/register"><Button className="w-full bg-slate-900">Começar Grátis</Button></Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-24 md:pt-40 md:pb-32 brand-gradient">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-slide-up">
                            <Badge className="mb-4 bg-brand-green/10 text-brand-green-active hover:bg-brand-green/20">
                                30 dias grátis
                            </Badge>
                            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                                Firmes.
                                <span className="block text-brand-blue">A gestão que sua igreja merece.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-xl">
                                A plataforma completa que fortalece a gestão da sua igreja. Membros, finanças, eventos e comunicação em um só lugar.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/register">
                                    <Button size="lg" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 h-12 px-8" data-testid="hero-cta-btn">
                                        Começar Teste Gratuito
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <a href="#features">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8">
                                        Ver Recursos
                                    </Button>
                                </a>
                            </div>
                            <div className="mt-8 flex items-center gap-6 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-brand-green" />
                                    <span>LGPD Compliant</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-brand-blue" />
                                    <span>Setup em minutos</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative animate-fade-in hidden lg:block">
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-floating border border-slate-200">
                                <img
                                    src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=600&fit=crop"
                                    alt="Igreja em comunidade"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-brand-green/20 rounded-full blur-3xl"></div>
                            <div className="absolute -top-6 -right-6 w-48 h-48 bg-brand-blue/20 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 md:py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-brand-blue/10 text-brand-blue-active">Recursos</Badge>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Tudo que sua igreja precisa
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Uma plataforma completa para gerenciar membros, eventos, finanças e comunicação.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={index}
                                    className="feature-card group cursor-default"
                                    data-testid={`feature-card-${index}`}
                                >
                                    <CardContent className="p-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green/10 to-brand-blue/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Icon className="w-6 h-6 text-brand-blue" />
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold text-slate-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-600">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-brand-green/10 text-brand-green-active">Planos</Badge>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Escolha o plano ideal
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            30 dias grátis em todos os planos. 20% de desconto no pagamento anual.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {plans.slice(0, 3).map((plan, index) => (
                            <Card
                                key={plan.type || index}
                                className={`relative overflow-hidden card-hover ${index === 1 ? 'border-brand-blue border-2 shadow-colored-glow' : ''}`}
                                data-testid={`plan-card-${plan.type}`}
                            >
                                {index === 1 && (
                                    <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                                        Mais Popular
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="font-heading">{plan.name}</CardTitle>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-slate-900">
                                            {formatCurrency(plan.price_monthly)}
                                        </span>
                                        <span className="text-slate-500">/mês</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">
                                        Até {plan.member_limit?.toLocaleString('pt-BR')} membros
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 mb-6">
                                        {plan.features?.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                                                <span className="text-slate-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/register">
                                        <Button
                                            className={`w-full ${index === 1 ? 'bg-brand-blue hover:bg-brand-blue-hover' : 'bg-slate-900 hover:bg-slate-800'}`}
                                            data-testid={`plan-btn-${plan.type}`}
                                        >
                                            Começar Agora
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500">
                            Precisa de mais? <a href="#" className="text-brand-blue font-medium hover:underline">Entre em contato para o plano Enterprise</a>
                        </p>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 md:py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-brand-green/10 text-brand-green-active">Depoimentos</Badge>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            O que nossos clientes dizem
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="card-hover" data-testid={`testimonial-${index}`}>
                                <CardContent className="pt-6">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 mb-4 italic">"{testimonial.text}"</p>
                                    <div>
                                        <p className="font-medium text-slate-900">{testimonial.name}</p>
                                        <p className="text-sm text-slate-500">{testimonial.church}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 md:py-32">
                <div className="max-w-3xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-brand-blue/10 text-brand-blue-active">FAQ</Badge>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Perguntas Frequentes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <Card key={index} className="card-hover" data-testid={`faq-${index}`}>
                                <CardContent className="pt-6">
                                    <h3 className="font-heading font-semibold text-slate-900 mb-2">{faq.question}</h3>
                                    <p className="text-slate-600">{faq.answer}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 md:py-32 bg-slate-900">
                <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
                    <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
                        Pronto para transformar a gestão da sua igreja?
                    </h2>
                    <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                        Junte-se a centenas de igrejas que já usam o Firmes. Comece seu teste gratuito de 30 dias hoje.
                    </p>
                    <Link to="/register">
                        <Button size="lg" className="bg-brand-green hover:bg-brand-green-hover text-white h-12 px-8" data-testid="cta-final-btn">
                            Começar Teste Gratuito
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <p className="mt-4 text-sm text-slate-400">Sem cartão de crédito. Cancele quando quiser.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                                <Church className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-heading font-bold text-white">Firmes</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            © 2024 Firmes. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
