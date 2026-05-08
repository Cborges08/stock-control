'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PackagePlus, PackageMinus } from 'lucide-react'

interface NavLinksProps {
  role: string | undefined
  onNavigate?: () => void
}

const allLinks = [
  { href: '/entrada', label: 'Entrada', Icon: PackagePlus, adminOnly: true },
  { href: '/retirada', label: 'Retirada', Icon: PackageMinus, adminOnly: false },
]

export function NavLinks({ role, onNavigate }: NavLinksProps) {
  const pathname = usePathname()

  const links = allLinks.filter((link) => !link.adminOnly || role === 'admin')

  return (
    <nav className="flex flex-col gap-1 mt-4">
      {links.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'flex items-center gap-2 px-3 py-2 rounded text-sm bg-rose-50 text-rose-700'
                : 'flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-50'
            }
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
