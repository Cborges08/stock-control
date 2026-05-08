'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ActionState = { error: 'credentials' | 'network' | null }

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validação básica: campos obrigatórios
  if (!email || !password) {
    return { error: 'credentials' }
  }

  const supabase = createClient()

  let authError: Error | null = null

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    authError = error
  } catch {
    // Erro de rede ou servidor — não erro de autenticação
    return { error: 'network' }
  }

  if (authError) {
    // Qualquer erro de auth retorna mensagem genérica (D-05 — prevenção de enumeração)
    // NÃO distinguir entre "email não encontrado" e "senha incorreta"
    return { error: 'credentials' }
  }

  // IMPORTANTE: redirect() deve estar FORA do try/catch
  // redirect() lança uma exceção especial do Next.js — capturá-la causa erro interno
  redirect('/retirada')
}
