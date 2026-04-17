'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { completePhaseAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'
import { PERMACULTURE_PHASES, getPhaseNameForNumber } from '@/lib/data/permaculture-plan'
import type { ProjectTask } from '@/types/orchard'

interface PhaseGateProps {
  projectId: string
  currentPhase: number
  phaseTasks: ProjectTask[]
}

export function PhaseGate({ projectId, currentPhase, phaseTasks }: PhaseGateProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  const completed = phaseTasks.filter((t) => t.completed_at && t.notes !== 'skipped')
  const incomplete = phaseTasks.filter((t) => !t.completed_at)
  const totalPhases = PERMACULTURE_PHASES.length
  const isLastPhase = currentPhase >= totalPhases

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completePhaseAction(projectId)
        toast.success(`Phase ${currentPhase + 1}: ${getPhaseNameForNumber(currentPhase + 1)} unlocked`)
        setConfirming(false)
      } catch {
        toast.error('Failed to complete phase')
      }
    })
  }

  if (isLastPhase && incomplete.length === 0) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-center">
        <p className="text-sm font-medium text-green-800">Permaculture Conversion Complete</p>
        <p className="text-xs text-green-600 mt-1">All 5 phases finished. Your system is established.</p>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="border border-stone-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold text-stone-700">
          Complete Phase {currentPhase}: {getPhaseNameForNumber(currentPhase)}?
        </p>
        <div className="text-xs text-stone-500 space-y-1">
          <p>Completed: {completed.length} tasks</p>
          <p>Will be skipped: {incomplete.length} tasks</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleComplete} disabled={isPending}>
            {isPending ? 'Advancing...' : 'Confirm & Unlock Next Phase'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border border-stone-200 rounded-lg px-4 py-3">
      <div>
        <p className="text-xs text-stone-400">
          Phase {currentPhase} of {totalPhases} — {completed.length}/{phaseTasks.length} done
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirming(true)}
        disabled={completed.length === 0}
      >
        Complete Phase
      </Button>
    </div>
  )
}

export function LockedPhases({ currentPhase }: { currentPhase: number }) {
  const totalPhases = PERMACULTURE_PHASES.length
  const locked = PERMACULTURE_PHASES.slice(currentPhase)

  if (locked.length === 0) return null

  return (
    <div className="space-y-1.5 mt-4">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Upcoming Phases</p>
      {locked.map((name, i) => (
        <div
          key={name}
          className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5 opacity-60"
        >
          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm text-stone-400">
            Phase {currentPhase + i + 1}: {name}
          </span>
        </div>
      ))}
    </div>
  )
}
