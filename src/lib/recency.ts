/**
 * Returns a color class based on how recently a tree was logged.
 * green  = logged within 3 days
 * yellow = logged 4–14 days ago
 * red    = logged 15+ days ago or never
 */
export function recencyColor(lastLoggedAt: string | null): 'green' | 'yellow' | 'red' {
  if (!lastLoggedAt) return 'red'
  const days = (Date.now() - new Date(lastLoggedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 3) return 'green'
  if (days <= 14) return 'yellow'
  return 'red'
}

export function recencyDot(color: 'green' | 'yellow' | 'red'): string {
  return {
    green:  'bg-green-400',
    yellow: 'bg-yellow-400',
    red:    'bg-red-400',
  }[color]
}

export function recencyLabel(lastLoggedAt: string | null): string {
  if (!lastLoggedAt) return 'Never logged'
  const days = Math.floor((Date.now() - new Date(lastLoggedAt).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
