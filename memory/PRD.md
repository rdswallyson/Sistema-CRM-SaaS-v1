# Firmes na Fé - Church Management SaaS

## Problem Statement
Sistema completo SaaS Multi-Tenant para gestão de igrejas chamado "Firmes – Na Fé". Sistema preparado para milhares de instituições com ambiente isolado por tenant_id.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async) + JWT Authentication
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Payments**: Stripe Integration (test mode)
- **Communication**: Twilio SMS/WhatsApp (MOCK - logs stored)

## User Personas
1. **Super Admin**: Proprietário da plataforma - gestão global
2. **Admin Igreja**: Pastor/Líder - gestão da igreja
3. **Tesoureiro**: Controle financeiro
4. **Líder de Ministério**: Gestão de ministérios
5. **Secretaria**: Cadastros e comunicação
6. **Membro/Visitante**: Acesso limitado

## Core Requirements (Static)
- Multi-tenant architecture with tenant_id isolation
- JWT authentication with role-based access
- Dashboard with real-time metrics and charts
- Member management with spiritual history
- Ministry management with goals
- Event management with check-in
- Financial module (tithes, offerings, donations)
- Communication module (email, SMS, WhatsApp)
- LGPD compliance

## What's Been Implemented (Jan 2026)
- [x] Landing page institucional completa
- [x] Sistema de autenticação JWT multi-tenant
- [x] Super Admin Dashboard com métricas globais
- [x] Gestão de igrejas (CRUD completo)
- [x] Gestão de planos e preços
- [x] Gestão de promoções/cupons
- [x] Church Admin Dashboard com gráficos
- [x] Gestão de membros completa
- [x] Gestão de ministérios
- [x] Gestão de eventos
- [x] Módulo financeiro (dízimos, ofertas, doações)
- [x] Módulo de comunicação (logs)
- [x] Configurações e personalização
- [x] Integração Stripe (test mode)

## Prioritized Backlog
### P0 (Critical)
- [ ] App Mobile (React Native ou PWA)
- [ ] Integração Mercado Pago (Brasil)
- [ ] Check-in QR Code real para eventos

### P1 (High)
- [ ] Twilio integration real (SMS/WhatsApp)
- [ ] Email sending (SendGrid)
- [ ] Doações recorrentes automáticas
- [ ] Relatórios exportáveis (PDF/Excel)

### P2 (Medium)
- [ ] Automação para visitantes (fluxos)
- [ ] Análise preditiva de evasão
- [ ] White label completo
- [ ] Backup automático diário
- [ ] Logs de atividade (auditoria)

## Next Tasks
1. Implementar Mercado Pago para pagamentos no Brasil
2. Integrar Twilio real para SMS/WhatsApp
3. Criar versão PWA/Mobile do sistema
4. Implementar QR Code real para check-in
5. Adicionar relatórios exportáveis

## Demo Credentials
- Super Admin: admin@firmesnafe.com / admin123

## Update - Feb 2026: Módulo de Discipulado

### Implementado:
- [x] 5 Trilhas padrão: Primeiros Passos, Batismo, Crescimento Espiritual, Liderança, Família
- [x] Sistema de etapas com tipos: texto, vídeo, quiz, tarefa
- [x] Inscrição de membros em trilhas
- [x] Sistema de mentoria (mentor-discípulo)
- [x] Progresso por etapas com barra de conclusão
- [x] Estatísticas: total, em andamento, concluídos, taxa de conclusão
- [x] Categorias com ícones e cores diferenciados
- [x] Níveis de dificuldade: Iniciante, Intermediário, Avançado

### Credenciais Demo Igreja:
- **Email**: pastor@vidanova.com
- **Senha**: pastor123
