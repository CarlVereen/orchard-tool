import { LogTypeIcon } from '@/components/logs/LogTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Log } from '@/types/orchard'

interface LogListProps {
  logs: Log[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })
}

// Group logs by date string
function groupByDate(logs: Log[]): [string, Log[]][] {
  const map = new Map<string, Log[]>()
  for (const log of logs) {
    const key = formatDate(log.logged_at)
    const group = map.get(key) ?? []
    group.push(log)
    map.set(key, group)
  }
  return Array.from(map.entries())
}

export function LogList({ logs }: LogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p className="text-sm">No logs yet. Add the first one.</p>
      </div>
    )
  }

  const groups = groupByDate(logs)

  return (
    <div className="space-y-6">
      {groups.map(([date, dateLogs]) => (
        <div key={date}>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">{date}</p>
          <div className="space-y-2">
            {dateLogs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const LOG_LABELS: Record<string, string> = {
  water: 'Watered',
  fertilize: 'Fertilized',
  production: 'Harvest',
  prune: 'Pruned',
  mow: 'Mowed',
  scout: 'Scouted',
  note: 'Note',
}

const SEVERITY_COLORS = ['text-stone-400', 'text-green-500', 'text-yellow-500', 'text-orange-500', 'text-red-400', 'text-red-600']

function LogItem({ log }: { log: Log }) {
  const hasQuantity = log.quantity !== null && log.unit
  const label = LOG_LABELS[log.log_type] ?? log.log_type

  return (
    <div className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5">
        <LogTypeIcon type={log.log_type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-stone-800">{label}</span>
          {hasQuantity && (
            <Badge variant="secondary" className="text-xs">
              {log.quantity} {log.unit}
            </Badge>
          )}
          {log.log_type === 'scout' && log.target && (
            <Badge variant="secondary" className="text-xs">
              {log.target}
            </Badge>
          )}
          {log.log_type === 'scout' && log.severity !== null && (
            <span className={`text-xs font-medium ${SEVERITY_COLORS[log.severity ?? 0]}`}>
              Severity {log.severity}/5
            </span>
          )}
          {log.batch_id && (
            <Badge variant="outline" className="text-xs text-stone-400">
              batch
            </Badge>
          )}
          <span className="text-xs text-stone-400 ml-auto">{formatTime(log.logged_at)}</span>
        </div>
        {log.notes && (
          <p className="text-sm text-stone-500 mt-1">{log.notes}</p>
        )}
      </div>
    </div>
  )
}
