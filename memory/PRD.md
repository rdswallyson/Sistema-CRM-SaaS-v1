# Firmes - Church Management SaaS Platform

## Problem Statement
Multi-tenant SaaS platform for church management ("Firmes"), supporting Super Admin and Church Admin roles with isolated tenant data.

## Tech Stack
- **Backend:** FastAPI + MongoDB (Pymongo)
- **Frontend:** React + TailwindCSS + Shadcn UI
- **Auth:** JWT-based authentication
- **Architecture:** Multi-tenant with `tenant_id` isolation

## Core Modules Implemented

### Super Admin Panel
- Manage churches (CRUD, activate/deactivate)
- Manage subscription plans
- Global metrics dashboard
- Promotions management

### Church Admin Panel
- **Dashboard:** KPI cards, charts (member growth, revenue), alerts, birthday notifications
- **Members Module (9 sub-pages):**
  - Ver todos, Adicionar membro, Campos adicionais, Categorias, Cargos
  - Cartao do membro (QR code), Aniversariantes, Relatorios, Editar nomes do menu
- **Departments Module:** Card-based UI, member management, dashboard interno
- **Groups Module (7 pages - TESTED Feb 28, 2026):**
  - Ver todos, Adicionar grupo, Categorias de grupos, Relatorios, Exportar, Painel Estrategico, Detalhe do grupo
- **Ensino Module (7 pages - TESTED Feb 28, 2026):**
  - Estudos, Escolas, Turmas, Acompanhamento Pessoal, Exportar, Painel Academico
  - Collections: estudos, escolas, turmas, turma_membros, progresso_ensino
- **Financial Module (12 pages - TESTED Mar 1, 2026):**
  - Resumo (Dashboard), Transacoes, Relatorios, Historico (Audit Logs)
  - Categorias, Contas, Contatos, Centros de Custos
  - Bloqueio de Periodos, Importar CSV, Exportar CSV, Painel Estrategico
  - Business rules: confirmed tx only cancelled, negative values rejected, blocked periods, audit logging
  - Collections: contas_financeiras, categorias_financeiras, centros_custos, contatos_financeiros, transacoes, financeiro_logs, periodos_bloqueados
- **Events:** CRUD with edit/delete, check-in
- **Discipleship:** Trails with progress tracking, mentorship
- **Communication:** Email/SMS/WhatsApp (placeholder), birthday auto-greeting
- **Settings:** Church customization

### Landing Page
- Conversion-focused institutional site with plans/FAQ

## Key API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register
- Members: /api/church/members (CRUD + filters)
- Departments: /api/church/departments (CRUD), /api/church/departments/{id}/members
- Groups: /api/church/groups (CRUD), /api/church/groups/{id}/members, /api/church/groups/strategic-dashboard
- Group Categories: /api/church/group-categories (CRUD)
- Ensino: /api/church/estudos, /api/church/escolas, /api/church/turmas, /api/church/turmas/{id}/membros
- Progresso: /api/church/progresso-ensino, /api/church/ensino/painel-academico
- Financial: /api/church/fin/contas, /api/church/fin/categorias, /api/church/fin/centros-custo
- Financial: /api/church/fin/contatos, /api/church/fin/transacoes, /api/church/fin/logs
- Financial: /api/church/fin/periodos-bloqueados, /api/church/fin/resumo, /api/church/fin/painel-estrategico
- Financial: /api/church/fin/importar

## Credentials
- Super Admin: admin@firmes.com / admin123
- Church Admin: admin.teste.154017@teste.com / admin123

## What's Completed
- [x] Full-stack scaffolding + Multi-tenant architecture with JWT auth
- [x] All core modules (Members, Events, Financial-basic, Discipleship, Communication)
- [x] Members Module Evolution (9 sub-pages) - Feb 28, 2026
- [x] Birthday notifications + auto-greeting system - Feb 28, 2026
- [x] Departments module (replaces Ministerios) - Feb 28, 2026
- [x] Groups module (7 pages, 23/23 backend tests) - Feb 28, 2026
- [x] Ensino module (7 pages, 34/34 backend tests) - Feb 28, 2026
- [x] Financial module (12 pages, 32/32 backend tests) - Mar 1, 2026

## Pending / Backlog
- [ ] Full System Integration Audit (all modules functional)
- [ ] Edit functionality review for all modules
- [ ] Gestao de Suporte e Tickets (Super Admin)
- [ ] Heatmap de presenca
- [ ] Analise preditiva de evasao
- [ ] WhatsApp/Twilio real integration
- [ ] Gamification and Certificates
- [ ] White-Labeling (custom domains)
- [ ] Mobile App
- [ ] Advanced AI features
- [ ] Refactor server.py into modular structure
