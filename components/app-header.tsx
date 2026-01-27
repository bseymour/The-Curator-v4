'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LayoutDashboard, Hash, Users, Building2, ListTodo, Bookmark, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/company', label: 'Company', icon: Building2 },
    { href: '/todos', label: 'To-Dos', icon: ListTodo },
    { href: '/toknows', label: 'To-Know', icon: Bookmark },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/about', label: 'About', icon: Info },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-4 gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary">
            <Hash className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">The Curator</span>
        </Link>

        <nav className="flex items-center gap-1 ml-auto overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
