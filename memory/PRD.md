# Firmes - Church Management SaaS Platform

## Problem Statement
Multi-tenant SaaS platform for church management with Super Admin and Church Admin roles. Features include member management, departments, groups, teaching (ensino), financial, agenda (calendar/events/notifications), discipleship, and communication modules.

## Architecture
- **Backend**: FastAPI (Python) + MongoDB (motor async) + JWT auth
- **Frontend**: React + TailwindCSS + Shadcn/UI + Axios
- **DB**: MongoDB with multi-tenant isolation via `tenant_id`
- **Auth**: JWT-based with `super_admin` and `admin_church` roles

## Core Requirements
1. Multi-Tenant Architecture with data isolation
2. Member Management (CRUD, categories, positions, custom fields, reports)
3. Departments (CRUD, member assignment, archive/reactivate)
4. Groups (CRUD, categories, leader assignment, reports, strategic panel)
5. Teaching/Ensino (Studies, Schools, Classes, Progress tracking, Academic dashboard)
6. Financial (Transactions, Categories, Accounts, Cost Centers, Contacts, Reports, Import/Export, Strategic dashboard)
7. **Agenda Module** (Calendar, Events free/paid, Mural de Avisos, Anotacoes, Notificacoes, Export)
8. Discipleship (Trails, Progress, Mentorship)
9. Communication (placeholder for WhatsApp/SMS/Email)

## What's Been Implemented
### Completed (All Tested)
- Full backend API with all CRUD endpoints for all modules
- Frontend pages for all modules with proper CRUD handlers
- Dashboard with stats, charts, and alerts
- Registration flow with auto-tenant creation (FIXED 2026-03-01)
- Members module with filtering, pagination, categories, positions, custom fields
- Departments module with member assignment and archiving
- Groups module with categories, leaders, reports
- Teaching module with 6 sub-pages
- Financial module with 12 sub-pages
- **Agenda module with 6 sub-pages** (IMPLEMENTED 2026-03-01)
  - Calendario: Monthly/list views with filters by type (evento/aviso/aniversario/financeiro/ensino)
  - Eventos: Free/paid events with financial integration, inscriptions management
  - Mural de Avisos: Announcements with priority, pinning, department/group targeting
  - Minhas Anotacoes: Personal private notes with color picker and reminders
  - Central de Notificacoes: Unified notifications with filters and mark-as-read
  - Exportar: Export events by period and inscription lists as CSV

### Test Results
- **iteration_8**: Backend 56/56 tests - Core CRUD across all modules
- **iteration_9**: Backend 33/33 tests - Agenda module complete (Events, Inscriptions, Avisos, Anotacoes, Notificacoes, Calendar, Export)

### DB Collections
- **Core**: users, tenants, members, departments, groups, group_categories
- **Ensino**: estudos, escolas, turmas, turma_membros, progresso_ensino
- **Financial**: transacoes, contas_financeiras, categorias_financeiras, centros_custo, contatos_financeiros, logs_financeiros, periodos_bloqueio
- **Agenda**: events, evento_inscricoes, avisos, anotacoes, notificacoes

## Credentials
- Super Admin: `admin@firmesnafe.com` / `admin123`
- Test Church Admin: `crud@test.com` / `crud123`

## Pending/Future Tasks
### P1 - Upcoming
- Implement missing Super Admin features (Gestao de Suporte/Tickets, Personalizacao de temas)
- Dashboard enhancements (Heatmap de presenca, Analise preditiva de evasao)
- WhatsApp integration via Twilio

### P2 - Future
- Gamification and Certificates
- Full White-Labeling (custom domains, editable price tables)
- Mobile App (member-facing)
- Advanced AI Features (behavioral analysis, leader suggestions)

### Refactoring Needed
- **server.py (HIGH)**: 3700+ lines monolith needs to be split into modules
- **Frontend components (MEDIUM)**: Create reusable components for common patterns

## Key Files
- `/app/backend/server.py` - Monolithic backend
- `/app/frontend/src/lib/api.js` - Centralized API functions
- `/app/frontend/src/App.js` - All frontend routes
- `/app/frontend/src/components/layout/DashboardLayout.jsx` - Sidebar navigation
- `/app/frontend/src/pages/church/agenda/` - 6 Agenda sub-pages
- `/app/frontend/src/pages/church/` - All church admin pages

## 3rd Party Integrations (Placeholder)
- Stripe: Payment placeholder
- Twilio: SMS/WhatsApp placeholder
