import type { LogType } from '@/types/orchard'

const icons: Record<LogType, { emoji: string; label: string; color: string }> = {
  water:     { emoji: '💧', label: 'Watered',     color: 'text-blue-500' },
  fertilize: { emoji: '🌿', label: 'Fertilized',  color: 'text-green-600' },
  production:{ emoji: '🧺', label: 'Production',  color: 'text-amber-500' },
  note:      { emoji: '📝', label: 'Note',        color: 'text-stone-400' },
  prune:     { emoji: '✂️', label: 'Pruned',      color: 'text-stone-600' },
  scout:     { emoji: '🔍', label: 'Scouted',     color: 'text-orange-500' },
}

interface LogTypeIconProps {
  type: LogType
  showLabel?: boolean
  className?: string
}

export function LogTypeIcon({ type, showLabel = false, className = '' }: LogTypeIconProps) {
  const { emoji, label, color } = icons[type]
  return (
    <span className={`inline-flex items-center gap-1 ${color} ${className}`}>
      <span role="img" aria-label={label}>{emoji}</span>
      {showLabel && <span className="text-sm">{label}</span>}
    </span>
  )
}
