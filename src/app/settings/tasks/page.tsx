import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrchard } from '@/lib/db/orchards'
import { getRows, getRowsWithTrees } from '@/lib/db/rows'
import { getTemplates } from '@/lib/db/tasks'
import { TaskTemplateManager } from '@/components/settings/TaskTemplateManager'

export default async function RecurringTasksPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  const [rows, rowsWithTrees, templates] = await Promise.all([
    getRows(orchard.id),
    getRowsWithTrees(orchard.id),
    getTemplates(orchard.id),
  ])

  const allTrees = rowsWithTrees.flatMap((r) => r.trees)

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/setup" className="hover:text-stone-600 transition-colors">Settings</Link>
        <span>/</span>
        <span className="text-stone-800">Recurring Tasks</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-stone-800 mb-1">Recurring Tasks</h1>
        <p className="text-stone-500 text-sm">
          Define task schedules that automatically assign to trees each year or month.
          Completing a task can automatically log the activity on each tree.
        </p>
      </div>

      <TaskTemplateManager
        orchardId={orchard.id}
        templates={templates}
        rows={rows}
        allTrees={allTrees}
      />
    </div>
  )
}
