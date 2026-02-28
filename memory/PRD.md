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
  - Ver todos: Card grid with search, filters (status/category/department), dropdown actions
  - Adicionar grupo: Form with name, description, category, department, leader, members selection
  - Categorias de grupos: CRUD with color picker
  - Relatorios: KPIs, ranking, full table, CSV export
  - Exportar: Select-based CSV export (all groups or specific group members)
  - Painel Estrategico: KPIs, bar charts by category/department, top 10 ranking
  - Detalhe do grupo: Info cards, members table with remove, CSV export
- **Events:** CRUD with edit/delete, check-in
- **Financial:** Donations tracking (tithe, offering, special)
- **Discipleship:** Trails with progress tracking, mentorship
- **Communication:** Email/SMS/WhatsApp (placeholder), birthday auto-greeting
- **Settings:** Church customization

### Landing Page
- Conversion-focused institutional site with plans/FAQ

## Database Collections
tenants, users, members, departments, department_members, events, donations, plans,
discipleship_trails, discipleship_progress, member_categories, member_positions,
custom_fields, menu_personalizacoes, communication_logs,
groups, group_members, group_categories

## Key API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register
- Members: /api/church/members (CRUD + filters)
- Departments: /api/church/departments (CRUD), /api/church/departments/{id}/members
- Groups: /api/church/groups (CRUD + filters), /api/church/groups/{id}/members
- Group Categories: /api/church/group-categories (CRUD)
- Strategic Dashboard: /api/church/groups/strategic-dashboard
- Communication: /api/church/birthday-template, /api/church/send-birthday-wishes

## Credentials
- Super Admin: admin@firmes.com / admin123
- Church Admin: admin.teste.154017@teste.com / admin123
- Tenant ID: 1ffbba66-d4f9-4efe-8e79-59dff1e95285

## What's Completed
- [x] Full-stack scaffolding
- [x] Multi-tenant architecture with JWT auth
- [x] All core modules (Members, Events, Financial, Discipleship, Communication)
- [x] Branding "Firmes" with sky blue theme
- [x] Members Module Evolution (9 sub-pages) - Feb 28, 2026
- [x] Birthday notifications + auto-greeting system - Feb 28, 2026
- [x] Departments module (replaces Ministerios) - Feb 28, 2026
- [x] Groups module (7 pages, fully tested 23/23 backend + all frontend) - Feb 28, 2026

## Pending / Backlog
- [ ] Full System Integration Audit (all modules clickable/functional)
- [ ] Edit functionality review for all modules
- [ ] Gestao de Suporte e Tickets (Super Admin)
- [ ] Heatmap de presenca
- [ ] Analise preditiva de evasao
- [ ] WhatsApp/Twilio real integration
- [ ] Gamification and Certificates
- [ ] White-Labeling (custom domains, editable prices)
- [ ] Mobile App
- [ ] Advanced AI features (behavioral analysis)
- [ ] Refactor server.py into modular structure
