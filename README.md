# Disparo+ — MVP da Plataforma de Campanhas Multicanal

MVP funcional com cadastro de **Operações** (B2B/B2C), **Leads** (com importação CSV), **Campanhas** segmentadas e **disparo via E-mail e WhatsApp**.

## Stack

- **Backend**: Node.js + Express + Sequelize (PostgreSQL)
- **Frontend**: React + Vite + Tailwind CSS
- **E-mail**: Nodemailer (compatível com SendGrid SMTP, Amazon SES, etc.)
- **WhatsApp**: Z-API (configurável por operação)

## Estrutura

```
mvp-platform/
├── backend/
│   ├── src/
│   │   ├── config/        # configuração do banco
│   │   ├── models/         # User, Operation, Lead, Campaign, CampaignMessage
│   │   ├── controllers/     # lógica de negócio
│   │   ├── routes/          # rotas da API
│   │   ├── middlewares/      # autenticação JWT
│   │   ├── services/         # email, whatsapp, templates
│   │   └── app.js            # entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/            # Login, Dashboard, Operações, Leads, Campanhas
    │   ├── components/        # Layout, ProtectedRoute
    │   ├── context/           # Auth, Operation (operação ativa)
    │   └── api/                # cliente axios
    └── .env.example
```

## Como rodar

### 1. Backend

```bash
cd backend
cp .env.example .env
# edite o .env com suas credenciais de banco e SMTP

npm install

# Crie o banco de dados PostgreSQL antes (ex: createdb campaigns_platform)
npm run dev
```

O servidor sobe em `http://localhost:3000`. As tabelas são criadas automaticamente no primeiro start (via `sequelize.sync()`).

### 2. Frontend

```bash
cd frontend
cp .env.example .env

npm install
npm run dev
```

O frontend sobe em `http://localhost:5173`.

## Fluxo de uso

1. **Criar conta** (`/register`) e fazer login.
2. **Criar uma Operação** (ex: "Vitrax", B2B) — configurar e-mail de envio e/ou credenciais Z-API.
3. **Importar leads** via CSV (colunas: `name, email, phone, company, jobTitle, segment, region, tags`) ou cadastrar manualmente.
4. **Criar uma Campanha**: escolher canal (e-mail/WhatsApp), escrever a mensagem com variáveis (`{{name}}`, `{{company}}`, etc.) e aplicar filtros de segmento/região/status.
5. **Pré-visualizar** quantos leads serão atingidos e ver um exemplo da mensagem renderizada.
6. **Disparar** — o sistema envia para cada lead com um pequeno intervalo (rate limiting) e registra o status de cada envio (enviado/falhou).
7. Trocar de operação pelo seletor no menu lateral para gerenciar outro negócio (ex: "Limpeza de Nome", "Home Equity") sem misturar os dados.

## Configuração de canais (por operação)

- **E-mail**: defina `emailFromName` e `emailFromAddress` na operação. As credenciais SMTP globais (SendGrid/SES) ficam no `.env` do backend.
- **WhatsApp (Z-API)**: cada operação tem seu próprio `whatsappInstanceId` e `whatsappToken` — assim cada negócio pode usar um número diferente.

## Próximos passos (pós-MVP)

- Integração com LinkedIn (Sales Navigator / Lead Gen Forms)
- Cadências automáticas multicanal (sequências com pausas e regras)
- Pipeline Kanban de leads
- Dashboard avançado com taxas de abertura/clique
- Integrações com CRMs externos e webhooks de captura
- Enriquecimento automático de leads (Apollo, Lusha)
- LGPD: fluxo completo de opt-out e exclusão de dados
