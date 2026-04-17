import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectWithTasks } from '@/lib/db/projects'
import { AnnualCalendar } from '@/components/tasks/AnnualCalendar'
import { PhaseGate, LockedPhases } from '@/components/tasks/PhaseGate'
import { ProjectDetailClient } from './ProjectDetailClient'
import { AddProjectTaskForm } from '@/components/tasks/AddProjectTaskForm'
import { getPhaseNameForNumber } from '@/lib/data/permaculture-plan'
import type { ExpertSpecies } from '@/lib/data/care-schedules'

export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId: string }
}) {
  const project = await getProjectWithTasks(params.projectId)
  if (!project) notFound()

  const subtitle =
    project.project_type === 'expert'
      ? `${new Date().getFullYear()} Care Calendar`
      : project.project_type === 'permaculture'
      ? `Phase ${project.current_phase}: ${getPhaseNameForNumber(project.current_phase)}`
      : `${project.tasks.filter((t) => !t.completed_at).length} remaining`

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6">
      <div className="mb-6">
        <Link
          href="/tasks/projects"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1 mb-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </Link>
        <h1 className="text-lg font-semibold text-stone-800">{project.name}</h1>
        <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
      </div>

      {project.project_type === 'expert' && project.species && (
        <AnnualCalendar
          species={project.species as ExpertSpecies}
          existingTasks={project.tasks}
        />
      )}

      {project.project_type === 'permaculture' && (
        <div className="space-y-4">
          <PhaseGate
            projectId={project.id}
            currentPhase={project.current_phase}
            phaseTasks={project.tasks.filter((t) => t.phase === project.current_phase)}
          />
          <ProjectDetailClient
            projectId={project.id}
            tasks={project.tasks.filter((t) => t.phase === project.current_phase)}
            projectType="permaculture"
          />
          <AddProjectTaskForm projectId={project.id} phase={project.current_phase} />
          <LockedPhases currentPhase={project.current_phase} />
        </div>
      )}

      {project.project_type === 'user' && (
        <div className="space-y-4">
          <ProjectDetailClient
            projectId={project.id}
            tasks={project.tasks}
            projectType="user"
          />
          <AddProjectTaskForm projectId={project.id} />
        </div>
      )}
    </main>
  )
}
