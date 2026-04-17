import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrchard } from '@/lib/db/orchards'
import { getProjectsWithTasks, getPermacultureProject } from '@/lib/db/projects'
import { generateExpertTasks } from '@/lib/tasks/generate-expert-tasks'
import { ViewToggle } from '@/components/tasks/ViewToggle'
import { CreateProjectSheet } from '@/components/tasks/CreateProjectSheet'
import { EnablePermacultureCard } from '@/components/tasks/EnablePermacultureCard'
import { getPhaseNameForNumber, getTotalPhases } from '@/lib/data/permaculture-plan'

export default async function ProjectsPage() {
  const orchard = await getOrchard()
  if (!orchard) redirect('/setup')

  await generateExpertTasks(orchard.id)

  const [projects, permProject] = await Promise.all([
    getProjectsWithTasks(orchard.id),
    getPermacultureProject(orchard.id),
  ])

  const expertProjects = projects.filter((p) => p.project_type === 'expert')
  const userProjects = projects.filter((p) => p.project_type === 'user')
  const permacultureProject = projects.find((p) => p.project_type === 'permaculture')

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-stone-800">Tasks</h1>
        <ViewToggle />
      </div>

      <div className="space-y-3">
        {/* Expert care projects */}
        {expertProjects.length > 0 && (
          <div className="space-y-2">
            {expertProjects.map((project) => {
              const incomplete = project.tasks.filter((t) => !t.completed_at).length
              const total = project.tasks.length
              return (
                <Link
                  key={project.id}
                  href={`/tasks/projects/${project.id}`}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-4 py-3 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{project.name}</p>
                    <p className="text-xs text-stone-400">Expert care schedule</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {total > 0 && (
                      <span className="text-xs text-stone-400">
                        {total - incomplete}/{total}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Permaculture project */}
        {permacultureProject ? (
          <Link
            href={`/tasks/projects/${permacultureProject.id}`}
            className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-4 py-3 hover:bg-stone-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-stone-800">Permaculture Conversion</p>
              <p className="text-xs text-stone-400">
                Phase {permacultureProject.current_phase} of {getTotalPhases()}: {getPhaseNameForNumber(permacultureProject.current_phase)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">
                {permacultureProject.tasks.filter((t) => t.completed_at && t.notes !== 'skipped').length}/
                {permacultureProject.tasks.filter((t) => t.phase === permacultureProject.current_phase).length}
              </span>
              <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ) : (
          <EnablePermacultureCard orchardId={orchard.id} />
        )}

        {/* User projects */}
        {userProjects.length > 0 && (
          <div className="space-y-2">
            {userProjects.map((project) => {
              const incomplete = project.tasks.filter((t) => !t.completed_at).length
              const total = project.tasks.length
              return (
                <Link
                  key={project.id}
                  href={`/tasks/projects/${project.id}`}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-4 py-3 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">{project.name}</p>
                    {total > 0 && (
                      <p className="text-xs text-stone-400">
                        {incomplete} remaining
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {total > 0 && (
                      <span className="text-xs text-stone-400">
                        {total - incomplete}/{total}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <CreateProjectSheet orchardId={orchard.id} />

        {expertProjects.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">
            Set species on your trees (e.g., &quot;Apple&quot;, &quot;Peach&quot;) to get expert care schedules.
          </p>
        )}
      </div>
    </main>
  )
}
