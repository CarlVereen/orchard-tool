import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getRowsWithTrees } from '@/lib/db/rows'
import { generateTasksForCurrentPeriod, getPendingTaskCountByTree } from '@/lib/db/tasks'
import type { TreeWithLastLog } from '@/types/orchard'

function conditionReason(tree: TreeWithLastLog): string | null {
  if (tree.condition === 'dead') return 'Marked as dead'
  if (tree.condition === 'poor') return 'Condition: poor'
  if (!tree.last_log) return 'Never logged'
  const days = Math.floor(
    (Date.now() - new Date(tree.last_log.logged_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days > 7) return `No activity for ${days} day${days === 1 ? '' : 's'}`
  return null
}

export default async function AttentionPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  const rows = await getRowsWithTrees(orchard.id)
  await generateTasksForCurrentPeriod(orchard.id)

  const allTreeIds = rows.flatMap((r) => r.trees.map((t) => t.id))
  const taskCounts = await getPendingTaskCountByTree(allTreeIds)

  // Build deduplicated list: condition/log issues take priority, then task-only trees
  const seen = new Set<string>()
  const needsAttention: { treeId: string; name: string; rowLabel: string; reason: string }[] = []

  for (const row of rows) {
    for (const tree of row.trees) {
      const cReason = conditionReason(tree)
      const taskCount = taskCounts.get(tree.id) ?? 0
      if (!cReason && taskCount === 0) continue

      seen.add(tree.id)
      let reason = cReason ?? ''
      if (taskCount > 0) {
        reason = cReason
          ? `${cReason} · ${taskCount} pending task${taskCount === 1 ? '' : 's'}`
          : `${taskCount} pending task${taskCount === 1 ? '' : 's'}`
      }
      needsAttention.push({
        treeId: tree.id,
        name: tree.variety ?? `Position ${tree.position}`,
        rowLabel: row.label,
        reason,
      })
    }
  }

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
          <span className="ml-2 text-sm font-normal text-red-500">
            {needsAttention.length} tree{needsAttention.length === 1 ? '' : 's'}
          </span>
        </h1>
      </div>

      {needsAttention.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p>All trees are up to date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {needsAttention.map(({ treeId, name, rowLabel, reason }) => (
            <Link
              key={treeId}
              href={`/trees/${treeId}`}
              className="flex items-center gap-4 bg-white border border-stone-200 rounded-lg px-4 py-3 hover:border-stone-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{name}</p>
                <p className="text-xs text-stone-400">{rowLabel}</p>
              </div>
              <span className="text-xs text-red-500 shrink-0 text-right max-w-[40%]">{reason}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
