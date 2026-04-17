import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getIncompleteTasksByOrchard, getCompletedTodayByOrchard } from '@/lib/db/projects'
import { generateExpertTasks } from '@/lib/tasks/generate-expert-tasks'
import { EXPERT_CARE_SCHEDULES } from '@/lib/data/care-schedules'
import { ViewToggle } from '@/components/tasks/ViewToggle'
import { DailyViewClient } from '@/components/tasks/DailyViewClient'
import type { DisplayTask, ProjectType } from '@/types/orchard'

const TYPE_RANK: Record<ProjectType, number> = { expert: 0, user: 1, permaculture: 2 }

function sortTasks(tasks: DisplayTask[]): DisplayTask[] {
  return tasks.sort((a, b) => {
    const typeRank = TYPE_RANK[a.projectType] - TYPE_RANK[b.projectType]
    if (typeRank !== 0) return typeRank
    const priDiff = a.priority - b.priority
    if (priDiff !== 0) return priDiff
    return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
  })
}

export default async function TasksPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  await generateExpertTasks(orchard.id)

  const [incompleteTasks, completedToday] = await Promise.all([
    getIncompleteTasksByOrchard(orchard.id),
    getCompletedTodayByOrchard(orchard.id),
  ])

  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndStr = weekEnd.toISOString().split('T')[0]
  const monthEnd = new Date()
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  const monthEndStr = monthEnd.toISOString().split('T')[0]

  const toDisplay = (t: typeof incompleteTasks[number]): DisplayTask => ({
    ...t,
    projectName: t.project_name,
    projectType: t.project_type,
    treeLabel: t.tree_label ?? undefined,
  })

  // Expert care tasks are "today" if the current month falls within their care window
  // (their due date marks the window end, not when they're due to start)
  const currentMonth = new Date().getMonth() + 1

  const isActiveExpertTask = (t: typeof incompleteTasks[number]) => {
    if (t.project_type !== 'expert' || !t.species) return false
    const schedule = EXPERT_CARE_SCHEDULES.find(
      (s) => s.species === t.species && s.title === t.title
    )
    return schedule ? currentMonth >= schedule.monthStart && currentMonth <= schedule.monthEnd : false
  }

  const todayTasks = sortTasks(
    incompleteTasks
      .filter((t) => t.project_type !== 'permaculture' && (
        !t.due_date || t.due_date <= today || isActiveExpertTask(t)
      ))
      .map(toDisplay)
  )

  const todayIds = new Set(todayTasks.map((t) => t.id))

  const comingUpTasks = sortTasks(
    incompleteTasks
      .filter((t) => t.project_type !== 'permaculture' && !todayIds.has(t.id) && t.due_date && t.due_date > today && t.due_date <= monthEndStr)
      .map(toDisplay)
  )

  const permacultureTasks = sortTasks(
    incompleteTasks
      .filter((t) => t.project_type === 'permaculture')
      .map(toDisplay)
  )

  const completedTodayDisplay: DisplayTask[] = completedToday.map(toDisplay)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-stone-800">Tasks</h1>
        <ViewToggle />
      </div>
      <DailyViewClient
        todayTasks={todayTasks}
        comingUpTasks={comingUpTasks}
        permacultureTasks={permacultureTasks}
        completedTodayTasks={completedTodayDisplay}
      />
    </main>
  )
}
