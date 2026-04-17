'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ViewToggle() {
  const pathname = usePathname()
  const isProjects = pathname.startsWith('/tasks/projects')

  return (
    <div className="flex bg-stone-100 rounded-lg p-0.5 text-sm">
      <Link
        href="/tasks"
        className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
          !isProjects ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Daily
      </Link>
      <Link
        href="/tasks/projects"
        className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
          isProjects ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Projects
      </Link>
    </div>
  )
}
