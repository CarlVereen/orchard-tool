import Link from 'next/link'
import type { RowWithTrees } from '@/types/orchard'

interface RowHeaderProps {
  row: RowWithTrees
  showLink?: boolean
}

export function RowHeader({ row, showLink = true }: RowHeaderProps) {
  const treeCount = row.trees.length

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showLink ? (
          <Link href={`/rows/${row.id}`} className="font-semibold text-stone-800 hover:underline">
            {row.label}
          </Link>
        ) : (
          <span className="font-semibold text-stone-800">{row.label}</span>
        )}
        <span className="text-sm text-stone-400">
          {treeCount} tree{treeCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
