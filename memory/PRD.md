# Firmes - Church Management SaaS Platform

## Problem Statement
Multi-tenant SaaS platform for church management with Super Admin and Church Admin roles. Features include member management, departments, groups, teaching (ensino), financial, events, discipleship, and communication modules.

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
7. Events (CRUD, check-in)
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
- Teaching module with 6 sub-pages (studies, schools, classes, tracking, export, academic panel)
- Financial module with 12 sub-pages (transactions, reports, history, categories, accounts, contacts, cost centers, lock periods, import, export, strategic panel)
- Events module with CRUD
- Discipleship module with trails and progress

### Critical Bug Fixed (2026-03-01)
**Root Cause**: Registration endpoint was not creating a tenant for new church admin users, leaving `tenant_id` as `None`. Since all CRUD operations require `tenant_id`, the app was effectively "view-only" for self-registered users.
**Fix Applied**:
1. Backend: `/api/auth/register` now auto-creates a tenant when `role=admin_church`
2. Frontend: `RegisterPage.jsx` now includes "Nome da Igreja" field
3. DB: Existing orphaned users (without tenant_id) were assigned to their correct tenants

### Test Results (iteration_8)
- Backend: 56/56 tests passed (Members, Categories, Positions, Custom Fields, Departments, Events, Groups, Group Categories, Registration)
- Frontend: All CRUD pages verified functional

## Credentials
- Super Admin: `admin@firmesnafe.com` / `admin123`
- Test Church Admin: `crud@test.com` / `crud123`

## Pending/Future Tasks
### P1 - Upcoming
- Implement missing Super Admin features (Gestão de Suporte/Tickets, Personalização de temas)
- Dashboard enhancements (Heatmap de presença, Análise preditiva de evasão)
- WhatsApp integration via Twilio

### P2 - Future
- Gamification and Certificates
- Full White-Labeling (custom domains, editable price tables)
- Mobile App (member-facing)
- Advanced AI Features (behavioral analysis, leader suggestions)

### Refactoring Needed
- **server.py (HIGH)**: 3260+ lines monolith needs to be split into modules (routes, models, services)
- **Frontend components (MEDIUM)**: Create reusable components for common patterns (data tables, forms, modals)

## Key Files
- `/app/backend/server.py` - Monolithic backend (ALL routes, models, logic)
- `/app/frontend/src/lib/api.js` - Centralized API functions
- `/app/frontend/src/App.js` - All frontend routes
- `/app/frontend/src/components/layout/DashboardLayout.jsx` - Sidebar navigation
- `/app/frontend/src/pages/church/` - All church admin pages

## 3rd Party Integrations (Placeholder)
- Stripe: Payment placeholder
- Twilio: SMS/WhatsApp placeholder
