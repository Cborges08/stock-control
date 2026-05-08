/**
 * scripts/seed-users.ts
 * One-shot user provisioning for Fava Sorvetes development environment.
 *
 * Usage: npx tsx scripts/seed-users.ts
 *
 * Creates:
 *   - admin@favasorvetes.com.br  (role: admin, display_name: Administrador)
 *   - operador@favasorvetes.com.br (role: operator, display_name: Operador)
 *
 * Idempotent: safe to run multiple times. Skips users that already exist.
 * Change passwords in Supabase Dashboard for production use.
 */

// Load .env.local for local development
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
  )
  process.exit(1)
}

// Create service role client directly — does NOT use lib/supabase/service.ts to avoid
// the 'server-only' import restriction which is incompatible with standalone tsx execution.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface UserSpec {
  email: string
  password: string
  role: 'admin' | 'operator'
  displayName: string
}

const USERS: UserSpec[] = [
  {
    email: 'admin@favasorvetes.com.br',
    password: 'Admin123!',
    role: 'admin',
    displayName: 'Administrador',
  },
  {
    email: 'operador@favasorvetes.com.br',
    password: 'Admin123!',
    role: 'operator',
    displayName: 'Operador',
  },
]

async function provisionUser(spec: UserSpec): Promise<void> {
  console.log(`\n-> Processing user: ${spec.email}`)

  // Check if user already exists (idempotency check)
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error(`  ERROR listing users: ${listError.message}`)
    throw listError
  }

  const existingUser = existingUsers.users.find((u) => u.email === spec.email)

  let userId: string

  if (existingUser) {
    console.log(`  SKIP: user already exists (id: ${existingUser.id})`)
    userId = existingUser.id

    // Ensure app_metadata.role is set correctly even if user already exists
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: spec.role },
    })
    if (updateError) {
      console.error(`  ERROR updating app_metadata: ${updateError.message}`)
      throw updateError
    }
    console.log(`  OK: app_metadata.role = '${spec.role}' ensured`)
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      app_metadata: { role: spec.role },
      email_confirm: true, // skip email confirmation for dev
    })

    if (createError) {
      console.error(`  ERROR creating user: ${createError.message}`)
      throw createError
    }

    userId = newUser.user.id
    console.log(`  CREATED: user id = ${userId}`)
  }

  // Upsert profiles row (idempotent: insert or update if already exists)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: spec.role,
        display_name: spec.displayName,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error(`  ERROR upserting profile: ${profileError.message}`)
    throw profileError
  }

  console.log(
    `  OK: profiles row upserted (role: ${spec.role}, display_name: ${spec.displayName})`
  )
}

async function main() {
  console.log('=== Fava Sorvetes --- User Seed Script ===')
  console.log(`Environment: ${SUPABASE_URL}`)
  console.log(`Users to provision: ${USERS.length}`)

  for (const spec of USERS) {
    await provisionUser(spec)
  }

  console.log('\n=== Done ===')
  console.log('Users provisioned successfully.')
  console.log('Change passwords in Supabase Dashboard before deploying to production.')
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err)
  process.exit(1)
})
