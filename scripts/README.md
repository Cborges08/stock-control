# Scripts de Desenvolvimento — Fava Sorvetes

## seed-users.ts

Script de provisionamento de usuários para ambiente de desenvolvimento.

### Uso

```bash
npx tsx scripts/seed-users.ts
```

Requer as seguintes variáveis de ambiente (definidas em `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

O script carrega `.env.local` automaticamente via `dotenv`. Certifique-se de que
as variáveis estejam definidas nesse arquivo antes de executar.

### Dependencia de execucao

O script requer `tsx` instalado localmente:

```bash
npm install --save-dev tsx
```

### Usuarios criados

| Email | Senha (dev) | Role | Display Name |
|-------|-------------|------|--------------|
| admin@favasorvetes.com.br | Admin123! | admin | Administrador |
| operador@favasorvetes.com.br | Admin123! | operator | Operador |

### Idempotencia

O script verifica se o usuario ja existe antes de criar. Seguro executar multiplas vezes sem criar duplicatas.

Se o usuario ja existir, o script garante que `app_metadata.role` esta correto e faz upsert do registro em `profiles`.

### Producao

**Altere as senhas no Supabase Dashboard antes de deployar em producao.**

Acesse: Supabase Dashboard -> Authentication -> Users -> selecione o usuario -> Reset Password

As credenciais acima (Admin123!) sao fracas por design — apenas para desenvolvimento local.
