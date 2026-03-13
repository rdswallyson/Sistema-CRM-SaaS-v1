# Sistema Firmes SaaS - Plataforma de Gestão Integrada

Uma plataforma SaaS completa e escalável para gerenciamento de organizações (igrejas, comunidades, etc.) com suporte a multi-tenancy, planos de assinatura, white label e painel administrativo centralizado.

## 🎯 Características Principais

### Arquitetura SaaS
- **Multi-Tenancy**: Isolamento completo de dados por organização
- **Planos de Assinatura**: Controle de funcionalidades por plano
- **White Label**: Personalização visual por organização
- **Painel Master**: Gerenciamento centralizado de organizações
- **API REST Completa**: Endpoints versionados com JWT + Refresh Token

### Módulos Disponíveis
- 👥 **Gerenciamento de Membros**: Cadastro, categorias, posições, campos customizados
- 🏢 **Departamentos**: Organização hierárquica de estruturas
- 👨‍👩‍👧‍👦 **Grupos**: Comunidades e grupos de interesse
- 📚 **Ensino**: Escolas, turmas, estudos e acompanhamento acadêmico
- 💰 **Financeiro**: Transações, categorias, centros de custo, relatórios
- 📅 **Agenda**: Calendário, eventos, inscrições e notificações
- 🎬 **Mídia**: Gerenciamento de arquivos e conteúdo
- 🏛️ **Patrimônio**: Inventário, movimentações e manutenção
- 🆘 **Suporte**: Sistema de tickets com SLA

## 🏗️ Arquitetura

### Backend (FastAPI + MongoDB)
```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Configurações da aplicação
│   │   ├── database.py        # Conexão com MongoDB
│   │   ├── security.py        # Autenticação e autorização
│   │   ├── middleware.py      # Multi-tenant e controle de planos
│   │   └── response.py        # Formatação de respostas
│   ├── models/
│   │   ├── base.py            # Modelo base com organizacao_id
│   │   ├── saas_models.py     # Modelos SaaS (Organizacao, Plano, etc)
│   │   └── [outros modelos]   # Modelos de domínio
│   ├── routers/
│   │   ├── auth.py            # Autenticação e refresh token
│   │   ├── master_panel.py    # Painel administrativo
│   │   └── [outros routers]   # Rotas de funcionalidades
│   └── main.py                # Aplicação FastAPI
├── requirements.txt           # Dependências Python
└── migration.py               # Script de migração de dados
```

### Frontend (React + Vite + TailwindCSS)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── MasterPanelDashboard.jsx  # Dashboard do painel master
│   │   │   └── [outras páginas admin]
│   │   ├── church/
│   │   │   └── [páginas de funcionalidades]
│   │   └── [outras páginas]
│   ├── components/
│   │   ├── WhiteLabelConfig.jsx          # Configuração de white label
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── api.js                        # Cliente HTTP com interceptadores
│   │   ├── auth.js                       # Contexto de autenticação
│   │   └── [utilitários]
│   └── App.js                            # Roteamento principal
├── package.json
└── tailwind.config.js
```

## 🚀 Instalação e Setup

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- MongoDB 5.0+
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/rdswallyson/Sistema-CRM-SaaS-v1.git
cd Sistema-CRM-SaaS-v1
```

### 2. Setup do Backend

#### Instalar Dependências
```bash
cd backend
pip install -r requirements.txt
```

#### Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Editar `.env` com suas configurações:
```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=sistema_firmes_saas

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Projeto
PROJECT_NAME=Sistema Firmes SaaS
```

#### Iniciar MongoDB (se não estiver rodando)
```bash
sudo systemctl start mongod
```

#### Executar Migrações (opcional)
```bash
python migration.py
```

#### Iniciar o Backend
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O backend estará disponível em `http://localhost:8000`

**Documentação Swagger**: `http://localhost:8000/docs`

### 3. Setup do Frontend

#### Instalar Dependências
```bash
cd frontend
npm install
# ou
yarn install
```

#### Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

#### Iniciar o Frontend (Desenvolvimento)
```bash
npm start
# ou
yarn start
```

O frontend estará disponível em `http://localhost:3000`

## 📖 Uso

### Primeiro Acesso

1. **Criar Organização** (via Painel Master)
   - Acesse `/admin/master`
   - Clique em "Nova Organização"
   - Preencha os dados e salve

2. **Criar Plano de Assinatura**
   - No Painel Master, acesse a aba "Planos"
   - Clique em "Novo Plano"
   - Configure funcionalidades e preço

3. **Criar Assinatura**
   - Selecione uma organização
   - Clique em "Criar Assinatura"
   - Escolha o plano e data de vencimento

4. **Criar Usuário**
   - Acesse a organização
   - Vá para Configurações > Usuários
   - Adicione novo usuário com role apropriada

### Roles Disponíveis

- **super_admin**: Acesso total ao painel master
- **master_admin**: Gerenciamento de organizações (painel master)
- **master_support**: Suporte técnico (painel master)
- **admin_church**: Administrador da organização
- **treasurer**: Acesso ao módulo financeiro
- **ministry_leader**: Líder de departamento/grupo
- **secretary**: Secretário
- **member**: Membro regular
- **visitor**: Visitante

## 🔐 Autenticação

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Resposta
{
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "admin_church",
      "organizacao_id": "org-id"
    }
  }
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

# Resposta
{
  "data": {
    "token": "novo-token-jwt"
  }
}
```

### Headers de Requisição
```bash
Authorization: Bearer <token>
```

## 🗄️ Banco de Dados

### Coleções Principais

#### organizacoes
```javascript
{
  id: String,
  organizacao_id: String,
  nome: String,
  slug: String,
  descricao: String,
  status: "ativa" | "inativa",
  criado_em: DateTime,
  atualizado_em: DateTime,
  deletado_em: DateTime | null
}
```

#### planos
```javascript
{
  id: String,
  organizacao_id: "master",
  nome: String,
  descricao: String,
  preco_mensal: Number,
  modulo_financeiro: Boolean,
  modulo_patrimonio: Boolean,
  modulo_ensino: Boolean,
  modulo_grupos: Boolean,
  modulo_agenda: Boolean,
  modulo_eventos_externos: Boolean,
  modulo_midia: Boolean,
  modulo_suporte: Boolean,
  criado_em: DateTime,
  atualizado_em: DateTime,
  deletado_em: DateTime | null
}
```

#### assinaturas
```javascript
{
  id: String,
  organizacao_id: String,
  plano_id: String,
  status: "ativa" | "cancelada" | "expirada",
  data_inicio: DateTime,
  data_vencimento: DateTime,
  criado_em: DateTime,
  atualizado_em: DateTime,
  deletado_em: DateTime | null
}
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Dados do usuário atual

### Painel Master (Super Admin)
- `GET /api/master/organizacoes` - Listar organizações
- `POST /api/master/organizacoes` - Criar organização
- `GET /api/master/organizacoes/{id}` - Detalhes da organização
- `PUT /api/master/organizacoes/{id}` - Atualizar organização
- `DELETE /api/master/organizacoes/{id}` - Deletar organização

- `GET /api/master/planos` - Listar planos
- `POST /api/master/planos` - Criar plano
- `PUT /api/master/planos/{id}` - Atualizar plano

- `POST /api/master/assinaturas` - Criar assinatura
- `GET /api/master/assinaturas/{org_id}` - Listar assinaturas

- `GET /api/master/dashboard/stats` - Estatísticas do painel
- `GET /api/master/logs-acesso` - Logs de acesso

### Membros
- `GET /api/church/members` - Listar membros
- `POST /api/church/members` - Criar membro
- `GET /api/church/members/{id}` - Detalhes do membro
- `PUT /api/church/members/{id}` - Atualizar membro
- `DELETE /api/church/members/{id}` - Deletar membro

### Departamentos
- `GET /api/church/departments` - Listar departamentos
- `POST /api/church/departments` - Criar departamento
- `GET /api/church/departments/{id}` - Detalhes
- `PUT /api/church/departments/{id}` - Atualizar
- `DELETE /api/church/departments/{id}` - Deletar

### Financeiro
- `GET /api/church/financial` - Resumo financeiro
- `GET /api/church/financial/transactions` - Transações
- `POST /api/church/financial/transactions` - Criar transação
- `GET /api/church/financial/categories` - Categorias
- `GET /api/church/financial/accounts` - Contas

*Veja documentação Swagger para todos os endpoints*

## 🚢 Deploy em Produção

### Backend (Heroku/Railway/Render)

1. **Preparar aplicação**
```bash
cd backend
pip freeze > requirements.txt
```

2. **Criar Procfile**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

3. **Variáveis de Ambiente**
```
MONGODB_URL=<sua-url-mongodb>
JWT_SECRET=<chave-segura>
CORS_ORIGINS=["https://seu-dominio.com"]
```

4. **Deploy**
```bash
git push heroku main
```

### Frontend (Vercel/Netlify)

1. **Build**
```bash
cd frontend
npm run build
```

2. **Deploy via Vercel**
```bash
npm install -g vercel
vercel
```

3. **Variáveis de Ambiente**
```
REACT_APP_BACKEND_URL=https://seu-backend.com
```

## 📊 Monitoramento

### Logs do Backend
```bash
# Desenvolvimento
uvicorn app.main:app --reload --log-level debug

# Produção
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

### Métricas
- Dashboard Master: `/admin/master` - Estatísticas em tempo real
- Logs de Acesso: `/api/master/logs-acesso`

## 🐛 Troubleshooting

### Erro: "Token inválido"
- Verifique se o token não expirou
- Tente fazer refresh do token
- Verifique se a chave JWT está correta

### Erro: "Organização não encontrada"
- Verifique se a organização existe
- Confirme se o usuário pertence à organização

### Erro: "Funcionalidade não disponível"
- Verifique o plano de assinatura
- Confirme se a assinatura está ativa

## 📝 Licença

Este projeto é propriedade do Sistema Firmes e está protegido por direitos autorais.

## 👥 Contribuidores

- Desenvolvimento SaaS: Manus Team

## 📞 Suporte

Para suporte técnico, abra uma issue no repositório ou entre em contato através do painel de suporte.

---

**Versão**: 1.0.0  
**Última atualização**: Março 2026
