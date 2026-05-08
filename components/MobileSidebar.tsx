'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NavLinks } from '@/components/NavLinks'
import { Button } from '@/components/ui/button'

interface MobileSidebarProps {
  role: string | undefined
  displayName: string
  logoutAction: () => Promise<void>
}

export function MobileSidebar({ role, displayName, logoutAction }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Abrir menu" />
          }
        >
          <Menu size={24} />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-6 flex flex-col">
          <span className="text-sm text-rose-700">Fava Sorvetes</span>

          <NavLinks role={role} onNavigate={() => setOpen(false)} />

          <div className="flex-1" />

          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600">{displayName}</span>
            <form action={logoutAction}>
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
        </SheetContent>
      </Sheet>
    </div>
  )
}
