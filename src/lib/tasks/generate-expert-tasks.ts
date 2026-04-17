import { createClient } from '@/lib/supabase/server'
import { EXPERT_CARE_SCHEDULES, SUPPORTED_SPECIES, type ExpertSpecies } from '@/lib/data/care-schedules'
import { getExpertTaskLastGenerated } from '@/lib/db/projects'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function generateExpertTasks(orchardId: string): Promise<void> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  const period = `${currentYear}-${pad(currentMonth)}`

  const lastGen = await getExpertTaskLastGenerated(orchardId, period)
  if (lastGen && now.getTime() - lastGen.getTime() < 60 * 60 * 1000) {
    return
  }

  const supabase = createClient()

  const { data: trees } = await supabase
    .from('trees')
    .select('id, species, variety, position, rows!inner(orchard_id, label)')
    .eq('rows.orchard_id', orchardId)
    .is('archived_at', null)
    .not('species', 'is', null)

  if (!trees?.length) return

  const treesBySpecies = new Map<ExpertSpecies, { id: string; species: string; variety: string | null; position: number; rowLabel: string }[]>()

  for (const tree of trees) {
    const s = (tree.species as string)?.toLowerCase().trim()
    if (!s) continue
    for (const supported of SUPPORTED_SPECIES) {
      if (s.includes(supported)) {
        if (!treesBySpecies.has(supported)) treesBySpecies.set(supported, [])
        const row = tree.rows as unknown as { orchard_id: string; label: string }
        treesBySpecies.get(supported)!.push({
          id: tree.id as string,
          species: tree.species as string,
          variety: tree.variety as string | null,
          position: tree.position as number,
          rowLabel: row.label,
        })
        break
      }
    }
  }

  if (treesBySpecies.size === 0) return

  const applicableTasks = EXPERT_CARE_SCHEDULES.filter(
    (t) => treesBySpecies.has(t.species) && currentMonth >= t.monthStart && currentMonth <= t.monthEnd
  )
  if (applicableTasks.length === 0) return

  for (const species of Array.from(treesBySpecies.keys())) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('orchard_id', orchardId)
      .eq('project_type', 'expert')
      .eq('species', species)
      .maybeSingle()

    if (!existing) {
      await supabase.from('projects').insert({
        orchard_id: orchardId,
        name: `${capitalize(species)} Care`,
        project_type: 'expert',
        species,
      })
    }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, species')
    .eq('orchard_id', orchardId)
    .eq('project_type', 'expert')

  if (!projects?.length) return

  const projectBySpecies = new Map(projects.map((p) => [p.species as string, p.id as string]))

  // Get existing tasks for this period to avoid duplicates
  const { data: existingTasks } = await supabase
    .from('project_tasks')
    .select('title, tree_id, period')
    .in('project_id', projects.map((p) => p.id))
    .eq('period', period)

  const existingSet = new Set(
    (existingTasks ?? []).map((t) => `${t.title}|${t.tree_id}`)
  )

  const tasksToInsert: {
    project_id: string
    tree_id: string
    title: string
    description: string
    priority: number
    due_date: string
    log_type: string | null
    species: string
    period: string
  }[] = []

  for (const task of applicableTasks) {
    const projectId = projectBySpecies.get(task.species)
    if (!projectId) continue

    const matchingTrees = treesBySpecies.get(task.species) ?? []
    for (const tree of matchingTrees) {
      const key = `${task.title}|${tree.id}`
      if (existingSet.has(key)) continue

      // Due date = last day of the task's month window
      const endMonth = task.monthEnd
      const lastDay = new Date(currentYear, endMonth, 0).getDate()
      const dueDate = `${currentYear}-${pad(endMonth)}-${pad(lastDay)}`

      tasksToInsert.push({
        project_id: projectId,
        tree_id: tree.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: dueDate,
        log_type: task.logType,
        species: task.species,
        period,
      })
    }
  }

  if (tasksToInsert.length > 0) {
    await supabase.from('project_tasks').insert(tasksToInsert)
  }
}
