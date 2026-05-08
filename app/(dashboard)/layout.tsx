import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth-logout'
import { NavLinks } from '@/components/NavLinks'
import { MobileSidebar } from '@/components/MobileSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Auth guard: getUser() valida JWT server-side — NUNCA getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar display_name da tabela profiles (D-15)
  // Fallback para user.email se a linha não existir (D-17)
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.email ?? 'Usuário'
  const role = user?.app_metadata?.role as string | undefined

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar — visible below lg only (D-05) */}
      <div className="flex lg:hidden items-center h-14 px-4 border-b border-rose-100 bg-white fixed top-0 left-0 right-0 z-40">
        <MobileSidebar role={role} displayName={displayName} logoutAction={logout} />
        <span className="text-sm text-rose-700 ml-3">Fava Sorvetes</span>
      </div>

      {/* Desktop sidebar — hidden below lg (D-05) */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-rose-100 flex-col p-6">
        {/* Brand label — rose-700, text-sm, weight normal (D-02, D-15) */}
        <span className="text-sm text-rose-700">Fava Sorvetes</span>

        <NavLinks role={role} />

        {/* Spacer — empurra seção do usuário para o fundo */}
        <div className="flex-1" />

        {/* Seção do usuário — display_name + botão Sair */}
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">{displayName}</span>
          {/* Logout: form action para Server Action — funciona sem JavaScript (D-15) */}
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
