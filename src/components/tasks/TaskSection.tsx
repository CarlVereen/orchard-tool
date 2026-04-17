'use client'

import { useState, type ReactNode } from 'react'

interface TaskSectionProps {
  title: string
  count: number
  defaultOpen?: boolean
  children: ReactNode
}

export function TaskSection({ title, count, defaultOpen = true, children }: TaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (count === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        <svg
          className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-stone-700">{title}</span>
        <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </button>
      {open && <div className="space-y-1.5 mt-1">{children}</div>}
    </div>
  )
}
