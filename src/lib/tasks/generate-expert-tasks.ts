import { createClient } from '@/lib/supabase/server'
import { EXPERT_CARE_SCHEDULES, SUPPORTED_SPECIES, type ExpertSpecies } from '@/lib/data/care-schedules'
import { getExpertTaskLastGenerated, upsertProjectTasks } from '@/lib/db/projects'

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
    .select('species, rows!inner(orchard_id)')
    .eq('rows.orchard_id', orchardId)
    .is('archived_at', null)
    .not('species', 'is', null)

  if (!trees?.length) return

  const userSpecies = new Set<ExpertSpecies>()
  for (const tree of trees) {
    const s = (tree.species as string)?.toLowerCase().trim()
    if (!s) continue
    for (const supported of SUPPORTED_SPECIES) {
      if (s.includes(supported)) {
        userSpecies.add(supported)
      }
    }
  }
  if (userSpecies.size === 0) return

  const applicableTasks = EXPERT_CARE_SCHEDULES.filter(
    (t) => userSpecies.has(t.species) && currentMonth >= t.monthStart && currentMonth <= t.monthEnd
  )
  if (applicableTasks.length === 0) return

  for (const species of Array.from(userSpecies)) {
    await supabase.from('projects').upsert(
      {
        orchard_id: orchardId,
        name: `${capitalize(species)} Care`,
        project_type: 'expert',
        species,
      },
      { onConflict: 'orchard_id,project_type,species', ignoreDuplicates: true }
    )
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, species')
    .eq('orchard_id', orchardId)
    .eq('project_type', 'expert')

  if (!projects?.length) return

  const projectBySpecies = new Map(projects.map((p) => [p.species as string, p.id as string]))

  const tasksToInsert = applicableTasks
    .filter((t) => projectBySpecies.has(t.species))
    .map((t) => ({
      project_id: projectBySpecies.get(t.species)!,
      title: t.title,
      description: t.description,
      priority: t.priority,
      due_date: `${currentYear}-${pad(currentMonth)}-01`,
      log_type: t.logType,
      species: t.species,
      period,
    }))

  if (tasksToInsert.length > 0) {
    await upsertProjectTasks(tasksToInsert)
  }
}
