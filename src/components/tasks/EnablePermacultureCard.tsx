'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { enablePermacultureAction } from '@/lib/actions/tasks'
import { toast } from 'sonner'

interface EnablePermacultureCardProps {
  orchardId: string
}

export function EnablePermacultureCard({ orchardId }: EnablePermacultureCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const currentYear = new Date().getFullYear()
  const [startYear, setStartYear] = useState(currentYear)

  const handleEnable = async () => {
    setSubmitting(true)
    try {
      await enablePermacultureAction(orchardId, startYear)
      toast.success('Permaculture Conversion plan started — Phase 1 tasks added')
    } catch {
      toast.error('Failed to enable permaculture plan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
      <h3 className="text-sm font-semibold text-stone-700">Permaculture Conversion</h3>
      <p className="text-xs text-stone-500 mt-1">
        Start a 5-year phased plan to convert your orchard into a full permaculture system.
        Tasks are paced realistically — one phase at a time, no rush.
      </p>
      <div className="flex items-center gap-3 mt-3">
        <label className="text-xs text-stone-500">
          Start year:
          <select
            value={startYear}
            onChange={(e) => setStartYear(parseInt(e.target.value))}
            className="ml-1.5 h-8 rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-800"
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <Button size="sm" onClick={handleEnable} disabled={submitting}>
          {submitting ? 'Starting...' : 'Start Plan'}
        </Button>
      </div>
    </div>
  )
}
