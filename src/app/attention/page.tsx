import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getRowsWithTrees } from '@/lib/db/rows'
import { generateTasksForCurrentPeriod, getPendingTaskCountByTree } from '@/lib/db/tasks'
import { createClient } from '@/lib/supabase/server'
import type { TreeWithLastLog } from '@/types/orchard'

function conditionReason(tree: TreeWithLastLog): string | null {
  if (tree.condition === 'dead') return 'Marked as dead'
  if (tree.condition === 'poor') return 'Condition: poor'
  return null
}

export default async function AttentionPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  const rows = await getRowsWithTrees(orchard.id)
  await generateTasksForCurrentPeriod(orchard.id)

  const allTreeIds = rows.flatMap((r) => r.trees.map((t) => t.id))
  const taskCounts = await getPendingTaskCountByTree(allTreeIds)

  // Count overdue project_tasks per tree
  const today = new Date().toISOString().split('T')[0]
  const supabase = createClient()
  const { data: overdueTasks } = await supabase
    .from('project_tasks')
    .select('tree_id')
    .in('tree_id', allTreeIds)
    .is('completed_at', null)
    .lt('due_date', today)

  const overdueByTree = new Map<string, number>()
  for (const row of overdueTasks ?? []) {
    const tid = row.tree_id as string
    overdueByTree.set(tid, (overdueByTree.get(tid) ?? 0) + 1)
  }

  const needsAttention: { treeId: string; name: string; rowLabel: string; reason: string }[] = []

  for (const row of rows) {
    for (const tree of row.trees) {
      const cReason = conditionReason(tree)
      const taskCount = taskCounts.get(tree.id) ?? 0
      const overdueCount = overdueByTree.get(tree.id) ?? 0
      if (!cReason && taskCount === 0 && overdueCount === 0) continue

      const reasons: string[] = []
      if (cReason) reasons.push(cReason)
      if (overdueCount > 0) reasons.push(`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`)
      if (taskCount > 0) reasons.push(`${taskCount} pending task${taskCount === 1 ? '' : 's'}`)

      needsAttention.push({
        treeId: tree.id,
        name: tree.variety ?? `Position ${tree.position}`,
        rowLabel: row.label,
        reason: reasons.join(' · '),
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
