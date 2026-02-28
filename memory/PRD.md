# Firmes - Church Management SaaS Platform

## Problem Statement
Multi-tenant SaaS platform for church management ("Firmes"), supporting Super Admin and Church Admin roles with isolated tenant data.

## Tech Stack
- **Backend:** FastAPI + MongoDB (Motor)
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
- **Dashboard:** KPI cards, charts (member growth, revenue), alerts
- **Members Module (EVOLVED - Feb 28, 2026):**
  - Ver todos: List with pagination, search, filters (status/category/position)
  - Adicionar membro: Full form with photo, category, position, custom fields
  - Campos adicionais: Custom fields CRUD (text/number/date/select/checkbox)
  - Categorias: Member categories CRUD with color
  - Cargos: Positions CRUD with hierarchy level
  - Cartão do membro: Digital card with QR code, print/PDF
  - Aniversariantes: Birthday list by month with today highlight
  - Relatórios: General/by category/by position reports, CSV export
  - Editar nomes do menu: Admin can customize all menu labels
- **Ministries:** CRUD with edit/delete
- **Events:** CRUD with edit/delete, check-in
- **Financial:** Donations tracking (tithe, offering, special)
- **Discipleship:** Trails with progress tracking, mentorship
- **Communication:** Email/SMS/WhatsApp (placeholder)
- **Settings:** Church customization

### Landing Page
- Conversion-focused institutional site with plans/FAQ

## Database Collections
tenants, users, members, ministries, events, donations, plans, discipleship_trails, discipleship_progress, member_categories, member_positions, custom_fields, menu_personalizacoes, communication_logs

## Credentials
- Super Admin: admin@firmes.com / admin123
- Church Admin: admin.teste.154017@teste.com / admin123

## What's Completed
- [x] Full-stack scaffolding
- [x] Multi-tenant architecture with JWT auth
- [x] All core modules (Members, Ministries, Events, Financial, Discipleship, Communication)
- [x] Branding "Firmes" with sky blue theme
- [x] Enhanced member profile with photo
- [x] **Members Module Evolution (9 sub-pages) - Feb 28, 2026**
- [x] Event edit/delete functionality
- [x] Member profile photo display

## Pending / Backlog
- [ ] Full System Integration Audit (all clickable/functional)
- [ ] Edit functionality for all modules (Financial donations etc.)
- [ ] Gestão de Suporte e Tickets
- [ ] Heatmap de presença
- [ ] Análise preditiva de evasão
- [ ] WhatsApp/Twilio real integration
- [ ] Gamification and Certificates
- [ ] White-Labeling (custom domains, editable prices)
- [ ] Mobile App
- [ ] Advanced AI features (behavioral analysis)
- [ ] Refactor server.py into modular structure
