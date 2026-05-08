'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth-login'

// SubmitButton precisa ser componente filho para usar useFormStatus corretamente
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </Button>
  )
}

const initialState = { error: null as 'credentials' | 'network' | null }

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState)
  const [localError, setLocalError] = useState<'credentials' | 'network' | null>(null)

  useEffect(() => {
    setLocalError(state.error)
  }, [state.error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50">
      <div className="flex flex-col items-center gap-6">
        <span
          style={{ fontFamily: 'cursive' }}
          className="text-2xl text-rose-700 tracking-wide"
        >
          fava
        </span>
        <Card className="w-[360px] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Fava Sorvetes</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onChange={() => setLocalError(null)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  onChange={() => setLocalError(null)}
                />
              </div>
              {localError === 'credentials' && (
                <p role="alert" className="text-sm text-red-600">
                  Credenciais inválidas
                </p>
              )}
              {localError === 'network' && (
                <p role="alert" className="text-sm text-red-600">
                  Erro ao conectar. Tente novamente.
                </p>
              )}
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
