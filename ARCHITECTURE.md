# Arquitetura do Sistema Firmes SaaS - Refatoração 2026

## Visão Geral

O Sistema Firmes SaaS foi completamente refatorado de um monólito de 3700+ linhas para uma **arquitetura modular escalável** com suporte a 8 módulos integrados.

## Stack Tecnológico

- **Backend:** FastAPI (Python 3.11) + Motor (MongoDB Async)
- **Banco de Dados:** MongoDB (Multi-tenant com `organizacao_id`)
- **Autenticação:** JWT (HS256) com Roles (Super Admin, Admin Church, Treasurer, etc.)
- **Armazenamento:** Local/S3 Híbrido (configurável)
- **Transações:** MongoDB Sessions (ACID-like)

## Estrutura de Pastas

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Configurações centralizadas
│   │   ├── database.py        # Conexão MongoDB
│   │   ├── security.py        # JWT, Hash, Roles
│   │   └── response.py        # Padronizador de respostas
│   ├── models/
│   │   ├── base.py            # Modelo base com organizacao_id e soft delete
│   │   ├── members.py         # Membros, Campos Adicionais, Cartão Digital
│   │   ├── departments.py     # Departamentos
│   │   ├── groups.py          # Grupos
│   │   ├── teaching.py        # Ensino/Educação
│   │   ├── financial.py       # Financeiro com Transações
│   │   ├── agenda.py          # Agenda e Notificações
│   │   ├── external_events.py # Eventos Externos com QR Code
│   │   └── media.py           # Mídias e Biblioteca
│   ├── routers/
│   │   ├── auth.py            # Login, Registro, Autenticação
│   │   ├── members.py         # CRUD Membros + Campos Adicionais
│   │   ├── departments.py     # CRUD Departamentos
│   │   ├── groups.py          # CRUD Grupos + Painel Estratégico
│   │   ├── teaching.py        # CRUD Ensino + Painel Acadêmico
│   │   ├── financial.py       # Transações, Bloqueio, Auditoria
│   │   ├── agenda.py          # Eventos, Avisos, Notificações
│   │   ├── external_events.py # Inscrição Pública, Gateway, Check-in
│   │   └── media.py           # Upload, Formulários, Álbuns
│   ├── utils/
│   │   └── qrcode_generator.py # Geração de QR Code com HMAC-SHA256
│   └── main.py                # Inicialização da aplicação
└── requirements.txt
```

## Padrões Implementados

### 1. Multi-Tenancy
- Todas as tabelas possuem `organizacao_id` obrigatório
- Extraído do token JWT em cada requisição
- Validado em todas as queries para isolamento de dados

### 2. Soft Delete
- Campo `deletado_em` (TIMESTAMP NULL) em todas as tabelas
- Registros nunca são removidos, apenas marcados como deletados
- Queries automaticamente filtram `deletado_em: None`

### 3. Respostas Padronizadas
```json
{
  "success": true,
  "data": { /* dados */ },
  "meta": { /* paginação, contadores */ },
  "errors": null
}
```

### 4. Transações ACID
- MongoDB Sessions para operações críticas (Financeiro)
- BEGIN → Validação → Operações → COMMIT ou ROLLBACK completo
- Exemplo: Pagamento → Receita Financeira → Ingresso → Notificação

### 5. Auditoria
- Logs imutáveis de todas as operações financeiras
- Registra: usuário, IP, ação, dados antes/depois em JSON
- Nunca permite deleção de logs

## Módulos Implementados

### Módulo 1: Membros ✅
- **Funcionalidades:**
  - CRUD com paginação (25/50/100 registros)
  - Validação de CPF único por organização
  - Campos Adicionais Dinâmicos (admin cria tipos de campo)
  - Cartão Digital com QR Code (HMAC-SHA256)
  - Histórico de Cargos (apenas 1 ativo por vez)
  - Lista de Aniversariantes por mês
  - Personalização de Menu em tempo real

### Módulo 2: Departamentos ✅
- **Funcionalidades:**
  - Renomeado de "Ministérios" em toda a aplicação
  - Cards com miniaturas de membros
  - Gestão de membros sem duplicidade
  - Arquivamento sem remover membros do sistema
  - Soft delete em cascata

### Módulo 3: Grupos ✅
- **Funcionalidades:**
  - Regra crítica: grupo DEVE ter líder ativo
  - Painel Estratégico com crescimento mensal
  - Categorias com cores personalizadas
  - Gestão de participantes

### Módulo 4: Ensino ✅
- **Funcionalidades:**
  - Painel Acadêmico com taxa de conclusão
  - Acompanhamento Pessoal por aluno
  - Status de turma: Ativa, Em Pausa, Concluída
  - Níveis: Básico, Intermediário, Avançado

### Módulo 5: Financeiro ✅ (CRÍTICO)
- **Funcionalidades:**
  - Transações Atômicas (Receita, Despesa, Transferência)
  - Bloqueio de Períodos (impede alterações retroativas)
  - Estorno automático com referência à original
  - Auditoria completa (logs imutáveis)
  - Atualização automática de saldo
  - Permissões: Admin (total), Tesoureiro (pendentes), Visualizador (leitura)

### Módulo 6: Agenda ✅
- **Funcionalidades:**
  - Calendário com filtros por tipo
  - Eventos gratuitos e pagos
  - Mural de Avisos com prioridade e fixação
  - Central de Notificações em tempo real
  - Badge de contagem de não lidas
  - Minhas Anotações com lembretes

### Módulo 7: Eventos Externos com QR Code ✅ (NOVO)
- **Funcionalidades:**
  - Página pública de inscrição (`/eventos/{slug}`)
  - Gateway de Pagamento (PIX, Crédito, Débito)
  - Webhook com validação HMAC obrigatória
  - Ingresso Digital com QR Code (UUID v4 + HMAC-SHA256)
  - Check-in via câmera/leitor
  - Fluxo Atômico: Pagamento → Receita → Ingresso → Notificação
  - Log de tentativas de check-in (válidas e inválidas)

### Módulo 8: Mídias e Biblioteca ✅ (NOVO)
- **Funcionalidades:**
  - Upload múltiplo com validação de extensão (lista branca)
  - Compressão automática e thumbnail
  - Organização em álbuns e pastas
  - Vinculação a: evento, departamento, grupo, membro
  - Formulários dinâmicos com exportação
  - Biblioteca Geral com estatísticas
  - Armazenamento híbrido (local/S3)
  - Hash SHA-256 para evitar duplicidade

## Endpoints Principais

### Autenticação
- `POST /api/login` - Login
- `POST /api/register` - Registro com auto-criação de tenant

### Membros
- `GET /api/church/members` - Listar (com paginação e filtros)
- `POST /api/church/members` - Criar
- `GET /api/church/members/{id}` - Detalhes
- `PUT /api/church/members/{id}` - Atualizar
- `DELETE /api/church/members/{id}` - Soft delete
- `POST /api/church/members/{id}/digital-card` - Gerar cartão digital
- `GET /api/church/members/birthdays` - Aniversariantes

### Departamentos
- `GET /api/church/departments` - Listar
- `POST /api/church/departments` - Criar
- `POST /api/church/departments/{id}/members/{member_id}` - Vincular membro

### Grupos
- `GET /api/church/groups/strategic-panel` - Painel estratégico

### Ensino
- `GET /api/church/teaching/academic-panel` - Painel acadêmico
- `GET /api/church/teaching/tracking/{member_id}` - Acompanhamento pessoal

### Financeiro
- `POST /api/church/financial/transactions` - Criar transação
- `POST /api/church/financial/transactions/{id}/reverse` - Estornar
- `GET /api/church/financial/strategic-panel` - Painel estratégico

### Agenda
- `GET /api/church/agenda/calendar` - Calendário
- `GET /api/church/agenda/notifications` - Notificações
- `PUT /api/church/agenda/notifications/{id}/read` - Marcar como lida

### Eventos Externos
- `GET /api/eventos/{slug}` - Página pública de inscrição
- `POST /api/eventos/{slug}/register` - Registrar para evento
- `POST /api/webhooks/payment` - Webhook de pagamento
- `POST /api/church/external-events/{id}/checkin` - Check-in via QR

### Mídias
- `POST /api/church/media/upload` - Upload de arquivo
- `GET /api/church/media` - Listar mídias
- `GET /api/church/media/library-stats` - Estatísticas da biblioteca
- `POST /api/church/media/forms` - Criar formulário

## Segurança

✅ **JWT com expiração configurável**
✅ **Hash HMAC-SHA256 para QR Codes**
✅ **Validação HMAC de webhooks**
✅ **Soft delete para auditoria**
✅ **Logs imutáveis de operações críticas**
✅ **Isolamento multi-tenant obrigatório**
✅ **Roles e permissões (Super Admin, Admin Church, Treasurer, etc.)**

## Próximas Melhorias

- [ ] Refatorar frontend React para componentes reutilizáveis
- [ ] Implementar cache Redis para painéis
- [ ] Adicionar testes unitários e integração
- [ ] Documentação Swagger/OpenAPI
- [ ] Integração com Twilio para SMS/WhatsApp
- [ ] Gamificação e Certificados
- [ ] White-Labeling completo
- [ ] Mobile App (React Native)

## Como Rodar

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## Variáveis de Ambiente

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=firmes_saas
JWT_SECRET=seu-secret-key-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=http://localhost:3000
```

---

**Última atualização:** 13 de Março de 2026
**Versão:** 2.0.0 (Refatoração Completa)
