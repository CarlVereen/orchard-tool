'use client'

import Link from 'next/link'
import { recencyColor, recencyDot, recencyLabel } from '@/lib/recency'
import type { TreeWithLastLog } from '@/types/orchard'

interface TreeCellProps {
  tree: TreeWithLastLog
  selectable?: boolean
  selected?: boolean
  onSelect?: (treeId: string) => void
  compact?: boolean
}

export function TreeCell({ tree, selectable = false, selected = false, onSelect, compact = false }: TreeCellProps) {
  const color = recencyColor(tree.last_log?.logged_at ?? null)
  const dotClass = recencyDot(color)
  const label = recencyLabel(tree.last_log?.logged_at ?? null)

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(tree.id)}
        className={`
          relative flex flex-col items-start justify-between
          border-2 rounded-lg p-3 text-left transition-all
          ${compact ? 'h-[80px] sm:min-w-[100px]' : 'h-[96px] sm:min-w-[120px]'}
          ${selected
            ? 'border-green-500 bg-green-50 shadow-sm'
            : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
          }
        `}
      >
        {selected && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </span>
        )}
        <span className="text-xs font-medium text-stone-800 leading-tight line-clamp-2 pr-5">
          {tree.variety ?? `Pos ${tree.position}`}
        </span>
        <span className="flex items-center gap-1 mt-auto">
          <span className={`w-2 h-2 rounded-full ${dotClass}`} />
          <span className="text-[10px] text-stone-500">{label}</span>
        </span>
      </button>
    )
  }

  return (
    <Link
      href={`/trees/${tree.id}`}
      className={`
        flex flex-col items-start justify-between
        border border-stone-200 bg-white rounded-lg p-3 text-left
        transition-all hover:border-stone-300 hover:shadow-sm
        ${compact ? 'h-[80px] sm:min-w-[100px]' : 'h-[96px] sm:min-w-[120px]'}
      `}
    >
      <span className="text-xs font-medium text-stone-800 leading-tight line-clamp-2">
        {tree.variety ?? `Pos ${tree.position}`}
      </span>
      <span className="flex items-center gap-1 mt-auto">
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-[10px] text-stone-500">{label}</span>
      </span>
    </Link>
  )
}

interface EmptyCellProps {
  position: number
  rowId: string
  compact?: boolean
}

export function EmptyCell({ position, rowId, compact = false }: EmptyCellProps) {
  return (
    <Link
      href={`/rows/${rowId}?add=${position}`}
      className={`
        flex items-center justify-center
        border border-dashed border-stone-200 rounded-lg
        text-stone-300 hover:text-stone-400 hover:border-stone-300 transition-colors
        ${compact ? 'h-[80px] sm:min-w-[100px]' : 'h-[96px] sm:min-w-[120px]'}
      `}
    >
      <span className="text-lg">+</span>
    </Link>
  )
}
