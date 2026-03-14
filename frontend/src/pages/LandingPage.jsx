import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Users,
    Building2,
    Users2,
    BookOpen,
    DollarSign,
    Calendar,
    Zap,
    FileText,
    Package,
    Headphones,
    Check,
    X,
    Menu,
    X as XIcon,
    ChevronDown,
    Star,
    MessageCircle,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    Youtube,
    Shield,
    Lock,
    BarChart3,
    Globe,
    Play,
    ArrowRight,
    Sparkles,
    Church,
} from 'lucide-react';
import { toast } from 'sonner';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState('monthly');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [counters, setCounters] = useState({ churches: 0, members: 0, modules: 0, uptime: 0 });
    const counterRef = useRef(null);

    // Scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Counter animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.5 }
        );

        if (counterRef.current) observer.observe(counterRef.current);
        return () => observer.disconnect();
    }, []);

    const animateCounters = () => {
        const targets = { churches: 500, members: 50000, modules: 10, uptime: 99.9 };
        const duration = 2000;
        const start = Date.now();

        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            setCounters({
                churches: Math.floor(targets.churches * progress),
                members: Math.floor(targets.members * progress),
                modules: Math.floor(targets.modules * progress),
                uptime: (targets.uptime * progress).toFixed(1),
            });

            if (progress < 1) requestAnimationFrame(animate);
        };

        animate();
    };

    const plans = [
        {
            name: 'Prata',
            price: 29.99,
            description: 'Para igrejas pequenas',
            color: 'from-gray-400 to-gray-500',
            badge: null,
            features: [
                { text: 'Até 100 membros', included: true },
                { text: 'Membros, Grupos, Agenda', included: true },
                { text: '1 usuário administrador', included: true },
                { text: 'Suporte por e-mail', included: true },
                { text: '1 filial', included: true },
                { text: 'Relatórios avançados', included: false },
                { text: 'Eventos com pagamento', included: false },
                { text: 'White Label', included: false },
            ],
            cta: 'Começar com Prata',
            ctaLink: '/register?plano=prata',
        },
        {
            name: 'Ouro',
            price: 49.99,
            description: 'Para igrejas em crescimento',
            color: 'from-yellow-500 to-yellow-600',
            badge: null,
            features: [
                { text: 'Até 300 membros', included: true },
                { text: 'Todos os módulos principais', included: true },
                { text: '3 usuários administradores', included: true },
                { text: 'Suporte por e-mail e chat', included: true },
                { text: 'Até 3 filiais', included: true },
                { text: 'Relatórios avançados', included: true },
                { text: 'Eventos com pagamento', included: false },
                { text: 'White Label', included: false },
            ],
            cta: 'Começar com Ouro',
            ctaLink: '/register?plano=ouro',
        },
        {
            name: 'Diamante',
            price: 69.99,
            description: 'Mais Popular',
            color: 'from-blue-600 to-blue-700',
            badge: '✦ Mais Popular',
            features: [
                { text: 'Até 1.000 membros', included: true },
                { text: 'Todos os módulos incluídos', included: true },
                { text: '10 usuários administradores', included: true },
                { text: 'Suporte prioritário', included: true },
                { text: 'Filiais ilimitadas', included: true },
                { text: 'Relatórios avançados', included: true },
                { text: 'Eventos com pagamento e QR Code', included: true },
                { text: 'Mídias e Patrimônio', included: true },
            ],
            cta: 'Começar com Diamante',
            ctaLink: '/register?plano=diamante',
            highlight: true,
        },
        {
            name: 'Rubi',
            price: 99.99,
            description: 'Máximo poder',
            color: 'from-red-600 to-red-700',
            badge: '✦ Plano Máximo',
            features: [
                { text: 'Membros ilimitados', included: true },
                { text: 'Todos os módulos incluídos', included: true },
                { text: 'Usuários ilimitados', included: true },
                { text: 'Suporte 24h prioritário', included: true },
                { text: 'White Label', included: true },
                { text: 'API para integração', included: true },
                { text: 'Painel Master multi-org', included: true },
                { text: 'Treinamento personalizado', included: true },
            ],
            cta: 'Começar com Rubi',
            ctaLink: '/register?plano=rubi',
        },
    ];

    const modules = [
        { icon: Users, title: 'Membros', desc: 'Cadastro completo, cartão digital, aniversariantes' },
        { icon: Building2, title: 'Departamentos', desc: 'Organize equipes e vincule membros' },
        { icon: Users2, title: 'Grupos', desc: 'Células, grupos de estudo e acompanhamento' },
        { icon: BookOpen, title: 'Ensino', desc: 'Escolas, turmas, estudos e acompanhamento' },
        { icon: DollarSign, title: 'Financeiro', desc: 'Controle de receitas, despesas e relatórios' },
        { icon: Calendar, title: 'Agenda', desc: 'Calendário, eventos e notificações em tempo real' },
        { icon: Zap, title: 'Eventos', desc: 'Inscrições online, pagamento e QR Code' },
        { icon: FileText, title: 'Mídias', desc: 'Fotos, vídeos, documentos centralizados' },
        { icon: Package, title: 'Patrimônio', desc: 'Controle de bens e movimentações' },
        { icon: Headphones, title: 'Suporte', desc: 'Central de atendimento com tickets' },
    ];

    const testimonials = [
        {
            name: 'Pr. João Silva',
            role: 'Pastor',
            church: 'Igreja Vida Nova',
            city: 'São Paulo/SP',
            text: 'O Firmes transformou completamente a gestão da nossa igreja. O controle financeiro e de membros ficou muito mais organizado.',
            rating: 5,
        },
        {
            name: 'Elizane Costa',
            role: 'Tesoureira',
            church: 'Igreja Boas Novas',
            city: 'Rio de Janeiro/RJ',
            text: 'Conseguimos organizar todos os nossos departamentos e grupos em um só lugar. Recomendo para toda igreja que quer crescer com ordem.',
            rating: 5,
        },
        {
            name: 'Diác. Marcos Oliveira',
            role: 'Diácono',
            church: 'Igreja Palavra Viva',
            city: 'Belo Horizonte/MG',
            text: 'A facilidade de controlar os eventos e as inscrições com QR Code foi incrível. Nossa conferência anual foi um sucesso.',
            rating: 5,
        },
    ];

    const faqs = [
        {
            q: 'Preciso instalar alguma coisa para usar o Firmes?',
            a: 'Não. O Firmes é 100% online, acesse de qualquer dispositivo com internet.',
        },
        {
            q: 'Posso cancelar quando quiser?',
            a: 'Sim. Não há fidelidade. Cancele a qualquer momento sem multas ou taxas.',
        },
        {
            q: 'Os dados da minha igreja ficam seguros?',
            a: 'Sim. Usamos criptografia SSL, backup automático diário e estamos em conformidade com LGPD.',
        },
        {
            q: 'Quantos usuários posso ter?',
            a: 'Depende do plano. Do Prata (1 admin) ao Rubi (ilimitado).',
        },
        {
            q: 'O sistema funciona no celular?',
            a: 'Sim. O Firmes é totalmente responsivo e funciona em qualquer dispositivo.',
        },
        {
            q: 'Como funciona o período de teste?',
            a: '14 dias grátis, sem necessidade de cartão. Após isso escolha o plano ideal.',
        },
    ];

    const handleDemoSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            toast.success('Demonstração solicitada! Entraremos em contato em breve.');
            e.target.reset();
        } catch (error) {
            toast.error('Erro ao enviar demonstração');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav
                className={`fixed w-full z-50 transition-all duration-300 ${
                    scrolled ? 'bg-[#0F2942] shadow-lg' : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#D4A017] rounded-lg flex items-center justify-center">
                                <Church className="w-5 h-5 text-[#0F2942]" />
                            </div>
                            <span className="font-bold text-white text-xl">Firmes</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#inicio" className="text-white hover:text-[#D4A017] transition">
                                Início
                            </a>
                            <a href="#funcionalidades" className="text-white hover:text-[#D4A017] transition">
                                Funcionalidades
                            </a>
                            <a href="#planos" className="text-white hover:text-[#D4A017] transition">
                                Planos
                            </a>
                            <a href="#depoimentos" className="text-white hover:text-[#D4A017] transition">
                                Depoimentos
                            </a>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F2942]"
                                onClick={() => navigate('/login')}
                            >
                                Acessar
                            </Button>
                            <Button
                                className="bg-[#D4A017] text-[#0F2942] hover:bg-[#F5D76E]"
                                onClick={() => navigate('/register')}
                            >
                                Começar Grátis
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <XIcon /> : <Menu />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden pb-4 space-y-2">
                            <a href="#inicio" className="block text-white hover:text-[#D4A017] py-2">
                                Início
                            </a>
                            <a href="#funcionalidades" className="block text-white hover:text-[#D4A017] py-2">
                                Funcionalidades
                            </a>
                            <a href="#planos" className="block text-white hover:text-[#D4A017] py-2">
                                Planos
                            </a>
                            <a href="#depoimentos" className="block text-white hover:text-[#D4A017] py-2">
                                Depoimentos
                            </a>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-[#D4A017] text-[#D4A017]"
                                    onClick={() => navigate('/login')}
                                >
                                    Acessar
                                </Button>
                                <Button
                                    className="flex-1 bg-[#D4A017] text-[#0F2942]"
                                    onClick={() => navigate('/register')}
                                >
                                    Grátis
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section
                id="inicio"
                className="relative min-h-screen pt-24 flex items-center overflow-hidden"
                style={{
                    backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663434866161/FxfXsU4Uss6hJgjcXpGK7Q/firmes-hero-bg-hr7Xmq88Higsxn7mSuFens.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <Badge className="bg-[#D4A017] text-[#0F2942] w-fit">
                                ✦ Gestão que transforma ministérios
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                Gerencie sua Igreja com Propósito, Ordem e Fé
                            </h1>
                            <p className="text-lg text-gray-100">
                                O Firmes é a plataforma completa para igrejas e ministérios gerenciarem membros, finanças, eventos, departamentos e muito mais — tudo em um só lugar.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    className="bg-[#D4A017] text-[#0F2942] hover:bg-[#F5D76E]"
                                    onClick={() => navigate('/register')}
                                >
                                    Começar Agora — Grátis
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-white text-white hover:bg-white/10"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Ver Demonstração
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-4 text-sm text-gray-100">
                                <div>✓ +500 Igrejas</div>
                                <div>✓ +50.000 Membros</div>
                                <div>✓ 10+ Módulos</div>
                                <div>✓ Suporte 24h</div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <img
                                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663434866161/FxfXsU4Uss6hJgjcXpGK7Q/firmes-dashboard-mockup-f7Gq4DNVkyEEEFwhSwYQx8.webp"
                                alt="Dashboard"
                                className="rounded-lg shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Counter Section */}
            <section ref={counterRef} className="bg-[#1A4B8C] py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-[#D4A017]">+{counters.churches}</div>
                            <div className="text-white mt-2">Igrejas usando</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-[#D4A017]">+{counters.members.toLocaleString()}</div>
                            <div className="text-white mt-2">Membros gerenciados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-[#D4A017]">{counters.modules}+</div>
                            <div className="text-white mt-2">Módulos integrados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-[#D4A017]">{counters.uptime}%</div>
                            <div className="text-white mt-2">Disponibilidade</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="funcionalidades" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-[#0F2942] mb-4">
                            Tudo que sua Igreja precisa em um só sistema
                        </h2>
                        <p className="text-lg text-gray-600">
                            Módulos completos, integrados e pensados para a realidade dos ministérios
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {modules.map((module, i) => {
                            const Icon = module.icon;
                            return (
                                <Card
                                    key={i}
                                    className="hover:shadow-lg hover:border-[#D4A017] transition-all duration-300 cursor-pointer group"
                                >
                                    <CardContent className="pt-6">
                                        <Icon className="w-8 h-8 text-[#D4A017] mb-4 group-hover:scale-110 transition" />
                                        <h3 className="font-bold text-[#0F2942] mb-2">{module.title}</h3>
                                        <p className="text-sm text-gray-600">{module.desc}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section id="planos" className="py-20 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-[#0F2942] mb-4">
                            Escolha o plano ideal para sua Igreja
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Sem taxas ocultas. Cancele quando quiser. Suporte incluído.
                        </p>

                        {/* Toggle */}
                        <div className="flex justify-center gap-4 mb-12">
                            <button
                                onClick={() => setActiveTab('monthly')}
                                className={`px-6 py-2 rounded-lg font-semibold transition ${
                                    activeTab === 'monthly'
                                        ? 'bg-[#D4A017] text-[#0F2942]'
                                        : 'bg-white text-gray-600 border border-gray-300'
                                }`}
                            >
                                Mensal
                            </button>
                            <button
                                onClick={() => setActiveTab('yearly')}
                                className={`px-6 py-2 rounded-lg font-semibold transition ${
                                    activeTab === 'yearly'
                                        ? 'bg-[#D4A017] text-[#0F2942]'
                                        : 'bg-white text-gray-600 border border-gray-300'
                                }`}
                            >
                                Anual (-20%)
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan, i) => (
                            <Card
                                key={i}
                                className={`relative overflow-hidden transition-all duration-300 ${
                                    plan.highlight ? 'md:col-span-1 lg:scale-105 shadow-2xl' : ''
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-0 left-0 right-0 bg-[#D4A017] text-[#0F2942] py-2 text-center font-bold text-sm">
                                        {plan.badge}
                                    </div>
                                )}
                                <CardHeader className={`bg-gradient-to-r ${plan.color} text-white ${plan.badge ? 'pt-12' : ''}`}>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <p className="text-sm opacity-90">{plan.description}</p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-[#0F2942]">
                                            R$ {activeTab === 'yearly' ? (plan.price * 12 * 0.8).toFixed(2) : plan.price.toFixed(2)}
                                        </span>
                                        <span className="text-gray-600">/{activeTab === 'yearly' ? 'ano' : 'mês'}</span>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        {plan.features.map((feature, j) => (
                                            <div key={j} className="flex items-center gap-2">
                                                {feature.included ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300" />
                                                )}
                                                <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                                                    {feature.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        className={`w-full ${
                                            plan.highlight
                                                ? 'bg-[#D4A017] text-[#0F2942] hover:bg-[#F5D76E]'
                                                : 'bg-[#0F2942] text-white hover:bg-[#1A4B8C]'
                                        }`}
                                        onClick={() => navigate(plan.ctaLink)}
                                    >
                                        {plan.cta}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Button
                            variant="outline"
                            className="border-[#D4A017] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#0F2942]"
                            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Falar com consultor
                        </Button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="depoimentos" className="py-20 bg-[#0F2942]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            O que as igrejas dizem sobre o Firmes
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, i) => (
                            <Card key={i} className="bg-[#1A4B8C] border-[#D4A017]">
                                <CardContent className="pt-6">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, j) => (
                                            <Star key={j} className="w-4 h-4 fill-[#D4A017] text-[#D4A017]" />
                                        ))}
                                    </div>
                                    <p className="text-white mb-4 italic">"{testimonial.text}"</p>
                                    <div className="border-t border-[#D4A017] pt-4">
                                        <p className="font-bold text-[#D4A017]">{testimonial.name}</p>
                                        <p className="text-sm text-gray-300">{testimonial.role}</p>
                                        <p className="text-sm text-gray-300">{testimonial.church}</p>
                                        <p className="text-sm text-gray-400">{testimonial.city}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-[#0F2942] mb-4">Dúvidas frequentes</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <Card
                                key={i}
                                className="cursor-pointer hover:border-[#D4A017] transition"
                                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg text-[#0F2942]">{faq.q}</CardTitle>
                                        <ChevronDown
                                            className={`w-5 h-5 text-[#D4A017] transition ${
                                                expandedFaq === i ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </div>
                                </CardHeader>
                                {expandedFaq === i && (
                                    <CardContent className="text-gray-600">{faq.a}</CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-20 bg-[#1A4B8C]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Segurança e Confiança</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center text-white">
                            <Lock className="w-12 h-12 mx-auto mb-4 text-[#D4A017]" />
                            <h3 className="font-bold mb-2">Dados criptografados</h3>
                            <p className="text-sm text-gray-300">Criptografia SSL de ponta a ponta</p>
                        </div>
                        <div className="text-center text-white">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-[#D4A017]" />
                            <h3 className="font-bold mb-2">Conformidade LGPD</h3>
                            <p className="text-sm text-gray-300">Totalmente em conformidade com a lei</p>
                        </div>
                        <div className="text-center text-white">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-[#D4A017]" />
                            <h3 className="font-bold mb-2">99,9% Disponibilidade</h3>
                            <p className="text-sm text-gray-300">Infraestrutura de alta performance</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-[#0F2942] to-[#1A4B8C]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Experimente o Firmes gratuitamente por 14 dias
                    </h2>
                    <p className="text-lg text-gray-100 mb-8">
                        Sem necessidade de cartão de crédito. Configure em minutos.
                    </p>
                    <Button
                        size="lg"
                        className="bg-[#D4A017] text-[#0F2942] hover:bg-[#F5D76E]"
                        onClick={() => navigate('/register')}
                    >
                        Quero minha demonstração gratuita
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0F2942] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-[#D4A017] rounded-lg flex items-center justify-center">
                                    <Church className="w-5 h-5 text-[#0F2942]" />
                                </div>
                                <span className="font-bold text-xl">Firmes</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">Gerencie com Propósito e Fé</p>
                            <div className="flex gap-4">
                                <a href="#" className="text-[#D4A017] hover:text-[#F5D76E]">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-[#D4A017] hover:text-[#F5D76E]">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="#" className="text-[#D4A017] hover:text-[#F5D76E]">
                                    <Youtube className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Links Rápidos</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>
                                    <a href="#inicio" className="hover:text-[#D4A017]">
                                        Início
                                    </a>
                                </li>
                                <li>
                                    <a href="#funcionalidades" className="hover:text-[#D4A017]">
                                        Funcionalidades
                                    </a>
                                </li>
                                <li>
                                    <a href="#planos" className="hover:text-[#D4A017]">
                                        Planos
                                    </a>
                                </li>
                                <li>
                                    <a href="#depoimentos" className="hover:text-[#D4A017]">
                                        Depoimentos
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Suporte</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Central de Ajuda
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Documentação
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Status do Sistema
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Fale Conosco
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Termos de Uso
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Política de Privacidade
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        LGPD
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-[#D4A017]">
                                        Cookies
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
                        <p>© 2025 Firmes. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Button */}
            <a
                href="https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o Sistema Firmes"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition animate-pulse"
                title="Fale conosco no WhatsApp"
            >
                <MessageCircle className="w-6 h-6" />
            </a>
        </div>
    );
};

export default LandingPage;
