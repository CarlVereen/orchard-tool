import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getRowsWithTrees } from '@/lib/db/rows'
import type { TreeWithLastLog } from '@/types/orchard'

function attentionReason(tree: TreeWithLastLog): string {
  if (tree.condition === 'dead') return 'Marked as dead'
  if (tree.condition === 'poor') return 'Condition: poor'
  if (!tree.last_log) return 'Never logged'
  const days = Math.floor(
    (Date.now() - new Date(tree.last_log.logged_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  return `No activity for ${days} day${days === 1 ? '' : 's'}`
}

export default async function AttentionPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  const rows = await getRowsWithTrees(orchard.id)

  const needsAttention = rows.flatMap((row) =>
    row.trees
      .filter((t) => {
        if (t.condition === 'poor' || t.condition === 'dead') return true
        if (!t.last_log) return true
        const days = (Date.now() - new Date(t.last_log.logged_at).getTime()) / (1000 * 60 * 60 * 24)
        return days > 7
      })
      .map((t) => ({ tree: t, rowLabel: row.label }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/" className="hover:text-stone-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-stone-800">Needs Attention</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-800">
          Needs Attention
          <span className="ml-2 text-sm font-normal text-red-500">{needsAttention.length} tree{needsAttention.length === 1 ? '' : 's'}</span>
        </h1>
      </div>

      {needsAttention.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p>All trees are up to date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {needsAttention.map(({ tree, rowLabel }) => (
            <Link
              key={tree.id}
              href={`/trees/${tree.id}`}
              className="flex items-center gap-4 bg-white border border-stone-200 rounded-lg px-4 py-3 hover:border-stone-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {tree.variety ?? `Position ${tree.position}`}
                </p>
                <p className="text-xs text-stone-400">{rowLabel}</p>
              </div>
              <span className="text-xs text-red-500 shrink-0">{attentionReason(tree)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
