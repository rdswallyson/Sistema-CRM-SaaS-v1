# Firmes - Church Management SaaS

## Problem Statement
Sistema completo SaaS Multi-Tenant para gestão de igrejas chamado "Firmes". Sistema preparado para milhares de instituições com ambiente isolado por tenant_id.

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
- Discipleship module with spiritual growth trails
- LGPD compliance

## What's Been Implemented (Feb 2026)
- [x] Landing page institucional completa
- [x] Sistema de autenticação JWT multi-tenant
- [x] Super Admin Dashboard com métricas globais
- [x] Gestão de igrejas (CRUD completo)
- [x] Gestão de planos e preços
- [x] Gestão de promoções/cupons
- [x] Church Admin Dashboard com gráficos
- [x] Gestão de membros completa
- [x] **Perfil completo do membro** com conexões a todos os módulos
- [x] Gestão de ministérios
- [x] Gestão de eventos
- [x] Módulo financeiro (dízimos, ofertas, doações)
- [x] Módulo de comunicação (logs)
- [x] **Módulo de Discipulado completo**
  - 5 Trilhas padrão
  - Sistema de etapas (texto, vídeo, quiz, tarefa)
  - Inscrição e progresso de membros
  - Sistema de mentoria
  - Certificados de conclusão
- [x] Configurações e personalização
- [x] Integração Stripe (test mode)

## Demo Credentials
- **Super Admin**: admin@firmes.com / admin123
- **Church Admin**: pastor@vidanova.com / pastor123

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
- [ ] Notificações automáticas de progresso no discipulado
- [ ] Certificados digitais de conclusão

### P2 (Medium)
- [ ] Gamificação (badges, pontos)
- [ ] Relatórios de engajamento no discipulado
- [ ] Automação para visitantes (fluxos)
- [ ] Análise preditiva de evasão
- [ ] White label completo
- [ ] Backup automático diário
- [ ] Logs de atividade (auditoria)

## Next Tasks
1. Implementar notificações automáticas de progresso
2. Criar certificados digitais de conclusão de trilhas
3. Implementar gamificação (badges, pontos)
4. Relatórios de engajamento no discipulado
