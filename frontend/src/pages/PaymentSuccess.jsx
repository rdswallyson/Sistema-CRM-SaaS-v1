import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentsAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2, Church } from 'lucide-react';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState('loading');
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            return;
        }

        const pollStatus = async (attempts = 0) => {
            if (attempts >= 5) {
                setStatus('timeout');
                return;
            }

            try {
                const response = await paymentsAPI.getPaymentStatus(sessionId);
                setPaymentData(response.data);

                if (response.data.payment_status === 'paid') {
                    setStatus('success');
                } else if (response.data.status === 'expired') {
                    setStatus('expired');
                } else {
                    // Continue polling
                    setTimeout(() => pollStatus(attempts + 1), 2000);
                }
            } catch (error) {
                console.error('Error checking payment:', error);
                setStatus('error');
            }
        };

        pollStatus();
    }, [sessionId]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-surface p-4 brand-gradient">
            <Card className="w-full max-w-md shadow-floating animate-scale-in" data-testid="payment-result-card">
                <CardContent className="pt-8 pb-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                            <Church className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-heading text-xl font-bold text-slate-900">Firmes</span>
                    </Link>

                    {status === 'loading' && (
                        <div className="space-y-4">
                            <Loader2 className="w-16 h-16 mx-auto text-brand-blue animate-spin" />
                            <h2 className="font-heading text-xl font-semibold text-slate-900">
                                Verificando pagamento...
                            </h2>
                            <p className="text-slate-500">
                                Aguarde enquanto confirmamos seu pagamento.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto rounded-full bg-brand-green/10 flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-brand-green" />
                            </div>
                            <h2 className="font-heading text-2xl font-semibold text-slate-900">
                                Pagamento Confirmado!
                            </h2>
                            <p className="text-slate-500">
                                Obrigado por assinar o Firmes. Sua conta já está ativa.
                            </p>
                            <Link to="/dashboard">
                                <Button className="mt-4 bg-slate-900 hover:bg-slate-800" data-testid="go-to-dashboard-btn">
                                    Acessar Dashboard
                                </Button>
                            </Link>
                        </div>
                    )}

                    {(status === 'error' || status === 'expired' || status === 'timeout') && (
                        <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h2 className="font-heading text-2xl font-semibold text-slate-900">
                                {status === 'expired' ? 'Sessão Expirada' : 'Erro no Pagamento'}
                            </h2>
                            <p className="text-slate-500">
                                {status === 'expired'
                                    ? 'A sessão de pagamento expirou. Por favor, tente novamente.'
                                    : 'Não foi possível processar seu pagamento. Por favor, tente novamente.'}
                            </p>
                            <div className="flex gap-3 justify-center mt-4">
                                <Link to="/">
                                    <Button variant="outline">Voltar ao Início</Button>
                                </Link>
                                <Link to="/#pricing">
                                    <Button className="bg-slate-900 hover:bg-slate-800">
                                        Tentar Novamente
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
