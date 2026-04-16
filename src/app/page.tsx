import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getRowsWithTrees } from '@/lib/db/rows'
import { getRecentLogs } from '@/lib/db/logs'
import { generateTasksForCurrentPeriod, getPendingTaskTreeIds } from '@/lib/db/tasks'
import { RowHeader } from '@/components/orchard/RowHeader'
import { RowGrid } from '@/components/orchard/RowGrid'
import { LogTypeIcon } from '@/components/logs/LogTypeIcon'
import { recencyLabel } from '@/lib/recency'

export default async function DashboardPage() {
  const orchard = await getOrchard()

  if (!orchard) {
    redirect('/setup')
  }

  const [rows, recentLogs] = await Promise.all([
    getRowsWithTrees(orchard.id),
    getRecentLogs(20),
  ])

  // Generate any due recurring tasks idempotently, then fetch pending counts
  await generateTasksForCurrentPeriod(orchard.id)
  const allTreeIds = rows.flatMap((r) => r.trees.map((t) => t.id))
  const pendingTaskTreeIds = await getPendingTaskTreeIds(allTreeIds)

  const totalTrees = rows.reduce((acc, r) => acc + r.trees.length, 0)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const loggedTodayIds = new Set(
    recentLogs
      .filter((l) => new Date(l.logged_at) >= todayStart)
      .map((l) => l.tree_id)
  )

  const conditionAttentionIds = new Set(
    rows.flatMap((r) => r.trees)
      .filter((t) => {
        const condBad = t.condition === 'poor' || t.condition === 'dead'
        if (condBad) return true
        if (!t.last_log) return true
        const days = (Date.now() - new Date(t.last_log.logged_at).getTime()) / (1000 * 60 * 60 * 24)
        return days > 7
      })
      .map((t) => t.id)
  )

  const notLoggedRecently = new Set([
    ...Array.from(conditionAttentionIds),
    ...Array.from(pendingTaskTreeIds),
  ]).size

  return (
    <div className="space-y-8">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Trees" value={String(totalTrees)} />
        <StatCard label="Logged Today" value={String(loggedTodayIds.size)} />
        <StatCard
          label="Need Attention"
          value={String(notLoggedRecently)}
          highlight={notLoggedRecently > 0}
          href={notLoggedRecently > 0 ? '/attention' : undefined}
        />
      </div>

      {/* Row grids */}
      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="mb-4">No rows yet.</p>
          <Link href="/setup" className="text-stone-600 underline text-sm">
            Add rows in Settings
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {rows.map((row) => (
            <section key={row.id} className="space-y-3">
              <RowHeader row={row} showLink />
              <RowGrid row={row} compact />
            </section>
          ))}
        </div>
      )}

      {/* Recent activity */}
      {recentLogs.length > 0 && (
        <section>
          <h2 className="font-semibold text-stone-800 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const tree = log.tree
              const row = tree?.row
              return (
                <Link
                  key={log.id}
                  href={`/trees/${log.tree_id}`}
                  className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3 hover:border-stone-300 transition-colors"
                >
                  <LogTypeIcon type={log.log_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {tree?.variety ?? `Position ${tree?.position}`}
                    </p>
                    <p className="text-xs text-stone-400">
                      {row?.label} · <span className="capitalize">{log.log_type}</span>
                      {log.quantity && log.unit ? ` · ${log.quantity} ${log.unit}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-stone-400 shrink-0">
                    {recencyLabel(log.logged_at)}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight = false, href }: { label: string; value: string; highlight?: boolean; href?: string }) {
  const content = (
    <>
      <p className="text-[10px] sm:text-xs text-stone-400 mb-1">{label}</p>
      <p className={`text-xl sm:text-2xl font-semibold ${highlight ? 'text-red-500' : 'text-stone-800'}`}>
        {value}
      </p>
    </>
  )
  if (href) {
    return (
      <Link href={href} className="bg-white border border-stone-200 rounded-lg px-4 py-4 block hover:border-stone-300 transition-colors">
        {content}
      </Link>
    )
  }
  return (
    <div className="bg-white border border-stone-200 rounded-lg px-4 py-4">
      {content}
    </div>
  )
}
