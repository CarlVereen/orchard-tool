import type { TreeSummary } from '@/types/orchard'

interface TreeSummaryStripProps {
  summary: TreeSummary
}

function daysAgoLabel(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 14) return `${days}d ago`
  const weeks = Math.round(days / 7)
  return `${weeks}wk ago`
}

export function TreeSummaryStrip({ summary }: TreeSummaryStripProps) {
  const { last_watered, last_fertilized, last_pruned,
          season_production_total, season_production_unit,
          logs_this_month, next_water_due_in_days } = summary

  // Water pill: if cycle is set use "Next in Xd" / "Overdue Xd", else last watered
  let waterLabel: string
  let waterColor = 'text-stone-500'
  if (next_water_due_in_days !== null) {
    if (next_water_due_in_days > 0) {
      waterLabel = `Next in ${next_water_due_in_days}d`
      waterColor = 'text-green-600'
    } else if (next_water_due_in_days === 0) {
      waterLabel = 'Due today'
      waterColor = 'text-amber-600'
    } else {
      waterLabel = `Overdue ${Math.abs(next_water_due_in_days)}d`
      waterColor = 'text-red-600'
    }
  } else {
    waterLabel = daysAgoLabel(last_watered)
  }

  const pills = [
    { emoji: '💧', label: waterLabel, color: waterColor },
    { emoji: '✂️', label: daysAgoLabel(last_pruned), color: 'text-stone-500' },
    { emoji: '🌿', label: daysAgoLabel(last_fertilized), color: 'text-stone-500' },
    {
      emoji: '🧺',
      label: season_production_total !== null
        ? `${season_production_total}${season_production_unit ? ' ' + season_production_unit : ''}`
        : '—',
      color: 'text-stone-500',
    },
    { emoji: '📋', label: `${logs_this_month} this mo.`, color: 'text-stone-500' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map(({ emoji, label, color }) => (
        <span
          key={emoji}
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white border border-stone-200 ${color}`}
        >
          <span>{emoji}</span>
          <span className={label === '—' ? 'text-stone-300' : ''}>{label}</span>
        </span>
      ))}
    </div>
  )
}
