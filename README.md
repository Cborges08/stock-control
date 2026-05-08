# Fava Sorvetes — Stock Control

Sistema web de controle de estoque de polpas de fruta para sorveteria. Substitui controle manual (planilhas/papel) por um sistema com rastreabilidade completa de lotes, FIFO automatico nas retiradas e historico imutavel de movimentacoes.

## Core Features

- **Entrada de NF-e** — Admin registra notas fiscais com multiplos itens em transacao atomica (tudo ou nada)
- **Retirada FIFO** — Operador retira estoque com selecao automatica do lote mais antigo
- **Controle de lotes** — Cada entrada cria um lote rastreavel; lotes fecham automaticamente ao esgotar
- **Estoque em tempo real** — VIEW `product_stock` calcula estoque atual a partir das movimentacoes (nunca uma coluna)
- **Role-based access** — Admin acessa /entrada e /retirada; operador acessa apenas /retirada
- **Grafico de estoque** — Barras horizontais com linha de alerta minimo em ambas as paginas
- **Duplicata bloqueada** — NF-e com mesma chave de acesso e rejeitada antes de qualquer insert (409)
- **Append-only** — `stock_movements` nunca sofre UPDATE ou DELETE; historico completo preservado

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email + password) |
| Charts | Recharts |
| ORM | None — Supabase client direto |

## Project Structure

```
app/
  (auth)/login/        # Login page
  (dashboard)/
    layout.tsx         # Sidebar nav, auth guard, responsive layout
    entrada/page.tsx   # NF-e entry form (admin only)
    retirada/page.tsx  # Withdrawal grid + modal (all roles)
  api/
    invoices/route.ts  # POST — atomic NF-e transaction
    movements/route.ts # POST — FIFO withdrawal
components/
  NavLinks.tsx         # Role-aware navigation links
  MobileSidebar.tsx    # Hamburger menu with Sheet overlay
  StockChart.tsx       # Recharts horizontal bar chart
  StockChartLoader.tsx # SSR-safe dynamic import wrapper
  ProductCard.tsx      # Product card with stock level badge
  MovementTable.tsx    # Recent movements table with filters
  invoice/             # InvoiceForm, InvoiceItemsTable, SidebarStockPanel
  stock/               # ProductGrid, WithdrawalModal, BatchTag, ProductStatusBadge
  ui/                  # shadcn/ui components (button, card, dialog, sheet, etc.)
lib/
  supabase/            # client.ts (browser), server.ts (SSR), service.ts (admin)
  validators/          # cnpj.ts, nfe.ts, invoice.ts, movement.ts (Zod schemas)
  parsers.ts           # parseNumeric() for Supabase NUMERIC columns
  utils/stock.ts       # getStockLevel(), STATUS_COLORS
  types.ts             # Shared TypeScript interfaces
supabase/
  migrations/          # 12 SQL migrations (tables, views, triggers, RPCs, RLS)
  seed.sql             # Initial product data
scripts/
  seed-users.ts        # Create admin + operator users via Supabase Admin API
  smoke-test.ts        # End-to-end test suite (20 assertions)
middleware.ts          # Session refresh + role-based route protection
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/Cborges08/stock-control.git
cd stock-control
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply database migrations

```bash
npx supabase db push
```

Or apply each file in `supabase/migrations/` manually via the Supabase SQL Editor (in order).

### 4. Seed products

Run the SQL in `supabase/seed.sql` via the Supabase SQL Editor to insert the initial product list.

### 5. Create users

```bash
npx tsx scripts/seed-users.ts
```

This creates two accounts:
- **Admin**: `admin@favasorvetes.com.br` / `Admin123!`
- **Operator**: `operador@favasorvetes.com.br` / `Operador123!`

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (TypeScript check) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run smoke-test` | Run E2E smoke test (requires dev server running) |
| `npm run types:gen` | Regenerate TypeScript types from Supabase schema |

## Database Architecture

### Key Tables

- **`products`** — Product catalog (polpa de acai, maracuja, morango, etc.)
- **`suppliers`** — Supplier registry (CNPJ, name)
- **`invoice_headers`** — NF-e header (nfe_key, number, series, dates, totals)
- **`invoice_items`** — NF-e line items (product, quantity, price)
- **`batches`** — Individual lots with `batch_number` format `ACAI-2026-001`
- **`stock_movements`** — Append-only ledger of all entries and withdrawals
- **`product_stock`** — VIEW that calculates current stock from movements (never a column)

### Critical Business Rules

| Rule | Enforcement |
|------|-------------|
| Append-only movements | No UPDATE/DELETE on `stock_movements` — RLS + app code |
| Stock as VIEW | `product_stock` VIEW = `SUM(entry) - SUM(withdrawal)` per product |
| Atomic NF-e entry | `fn_create_invoice` RPC — SECURITY DEFINER, full rollback on error |
| FIFO withdrawal | `fn_create_movement` RPC — `ORDER BY opened_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED` |
| Batch auto-close | `trg_close_batch` trigger — sets `status='closed'` when `quantity_out >= quantity_in` |
| Duplicate NF-e guard | Pre-flight `nfe_key` check returns 409 before any insert |
| Auth via getUser() | Never `getSession()` — server-side JWT validation only |

### RPC Functions

- **`fn_create_invoice`** — Atomic: supplier upsert, header, items, batches, movements in one transaction
- **`fn_create_movement`** — FIFO batch selection, stock validation, movement insert, auto-close check

## Deployment

### Vercel (recommended)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy — Vercel auto-detects Next.js

### Smoke Test

With the dev server running:

```bash
npm run smoke-test
```

Validates: NF-e entry (201), duplicate guard (409), FIFO withdrawal, batch auto-close, auth enforcement (401), and append-only integrity.

## License

Private project — all rights reserved.
