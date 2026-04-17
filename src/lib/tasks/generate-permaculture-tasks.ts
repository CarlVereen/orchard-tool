import { PERMACULTURE_PLAN } from '@/lib/data/permaculture-plan'
import { getProjectTasks, upsertProjectTasks } from '@/lib/db/projects'
import type { Project } from '@/types/orchard'

export async function generatePermaculturePhaseTasks(project: Project): Promise<void> {
  const phase = project.current_phase
  const startYear = project.start_year ?? new Date().getFullYear()

  const existingTasks = await getProjectTasks(project.id)
  const existingPhase = existingTasks.filter((t) => t.phase === phase)
  if (existingPhase.length > 0) return

  const phaseTasks = PERMACULTURE_PLAN.filter((t) => t.year === phase)
  if (phaseTasks.length === 0) return

  const pad = (n: number) => String(n).padStart(2, '0')
  const absoluteYear = startYear + phase - 1

  const tasksToInsert = phaseTasks.map((t) => {
    const quarterMonth = (t.quarter - 1) * 3 + 1
    return {
      project_id: project.id,
      title: t.title,
      description: t.description,
      priority: 3 as const,
      due_date: `${absoluteYear}-${pad(quarterMonth)}-01`,
      phase,
      period: `${absoluteYear}-Q${t.quarter}`,
    }
  })

  await upsertProjectTasks(tasksToInsert)
}
