'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createTemplateAction,
  updateTemplateAction,
  toggleTemplateActiveAction,
  deleteTemplateAction,
} from '@/lib/actions/orchard'
import type { TaskTemplate, TaskTargetScope, TaskScheduleType, LogType, Row, TreeWithLastLog } from '@/types/orchard'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS: { value: number; short: string }[] = [
  { value: 0, short: 'Sun' },
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
]

const LOG_TYPE_OPTIONS: { value: LogType; label: string }[] = [
  { value: 'water', label: 'Water' },
  { value: 'fertilize', label: 'Fertilize' },
  { value: 'prune', label: 'Prune' },
  { value: 'mow', label: 'Mow' },
  { value: 'scout', label: 'Scout' },
  { value: 'production', label: 'Production' },
  { value: 'note', label: 'Note' },
]

function scheduleLabel(t: TaskTemplate) {
  if (t.schedule_type === 'annual') {
    return `Annual · ${MONTHS[t.month_start - 1]}–${MONTHS[t.month_end - 1]}`
  }
  if (t.schedule_type === 'weekly') {
    if (t.weekdays && t.weekdays.length > 0) {
      return `Weekly · ${t.weekdays.map((w) => WEEKDAYS[w].short).join(', ')}`
    }
    return 'Weekly'
  }
  if (t.schedule_type === 'daily') return 'Daily'
  if (t.schedule_type === 'interval') {
    return t.interval_days ? `Every ${t.interval_days} day${t.interval_days === 1 ? '' : 's'}` : 'Interval'
  }
  return t.stagger_by_row ? 'Monthly · Staggered by row' : 'Monthly'
}

function targetLabel(t: TaskTemplate) {
  if (t.target_scope === 'rows') return `${t.row_ids.length} row${t.row_ids.length === 1 ? '' : 's'}`
  if (t.target_scope === 'per_row') return `${t.row_ids.length} row${t.row_ids.length === 1 ? '' : 's'} (per-row)`
  if (t.target_scope === 'trees') return `${t.tree_ids.length} tree${t.tree_ids.length === 1 ? '' : 's'}`
  return 'All trees'
}

const SCOPE_LABEL: Record<TaskTargetScope, string> = {
  all: 'All trees',
  rows: 'Specific rows (one task per tree)',
  per_row: 'Per row (one task per row)',
  trees: 'Specific trees',
}

interface TemplateFormProps {
  orchardId: string
  rows: Row[]
  allTrees: TreeWithLastLog[]
  initial?: TaskTemplate
  onDone: () => void
}

function TemplateForm({ orchardId, rows, allTrees, initial, onDone }: TemplateFormProps) {
  const [scheduleType, setScheduleType] = useState<TaskScheduleType>(
    initial?.schedule_type ?? 'annual'
  )
  const [targetScope, setTargetScope] = useState<TaskTargetScope>(initial?.target_scope ?? 'all')
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(initial?.row_ids ?? [])
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>(initial?.tree_ids ?? [])
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(initial?.weekdays ?? [])
  const [intervalDays, setIntervalDays] = useState<string>(
    initial?.interval_days ? String(initial.interval_days) : '3'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleRow = (id: string) =>
    setSelectedRowIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleTree = (id: string) =>
    setSelectedTreeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleWeekday = (v: number) =>
    setSelectedWeekdays((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    // Ensure stagger_by_row is serialised as string boolean
    if (!fd.has('stagger_by_row')) fd.set('stagger_by_row', 'false')
    try {
      const result = initial
        ? await updateTemplateAction(initial.id, fd, selectedRowIds, selectedTreeIds)
        : await createTemplateAction(orchardId, fd, selectedRowIds, selectedTreeIds)
      if (result.ok) {
        onDone()
      } else {
        setError(result.error)
        setSaving(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={initial?.title ?? ''} placeholder="e.g. Prune trees" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="log_type">Activity log type <span className="text-stone-400 font-normal">(optional)</span></Label>
        <select
          id="log_type"
          name="log_type"
          defaultValue={initial?.log_type ?? ''}
          className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          <option value="">None — task only</option>
          {LOG_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-xs text-stone-400">When set, completing this task automatically records a log entry of that type.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Schedule type</Label>
        <div className="flex gap-2 flex-wrap">
          {(['daily', 'interval', 'weekly', 'monthly', 'annual'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScheduleType(s)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                scheduleType === s
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input type="hidden" name="schedule_type" value={scheduleType} />
      </div>

      {scheduleType === 'interval' && (
        <div className="space-y-1.5">
          <Label htmlFor="interval_days">Every how many days?</Label>
          <Input
            id="interval_days"
            name="interval_days"
            type="number"
            min="1"
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            required
          />
          <p className="text-xs text-stone-400">Next task is created this many days after the previous one is completed.</p>
        </div>
      )}

      {scheduleType === 'weekly' && (
        <div className="space-y-1.5">
          <Label>Days of the week <span className="text-stone-400 font-normal">(optional — leave empty for Monday)</span></Label>
          <div className="flex gap-1.5 flex-wrap">
            {WEEKDAYS.map((d) => {
              const selected = selectedWeekdays.includes(d.value)
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWeekday(d.value)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    selected
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {d.short}
                </button>
              )
            })}
          </div>
          {selectedWeekdays.map((v) => (
            <input key={v} type="hidden" name="weekdays" value={v} />
          ))}
        </div>
      )}

      {scheduleType === 'annual' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="month_start">Start month</Label>
            <select
              id="month_start"
              name="month_start"
              defaultValue={initial?.month_start ?? 1}
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="month_end">End month</Label>
            <select
              id="month_end"
              name="month_end"
              defaultValue={initial?.month_end ?? 12}
              className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {(scheduleType === 'weekly' || scheduleType === 'daily' || scheduleType === 'interval') && (
        <>
          <input type="hidden" name="month_start" value="1" />
          <input type="hidden" name="month_end" value="12" />
          <input type="hidden" name="stagger_by_row" value="false" />
        </>
      )}

      {scheduleType === 'monthly' && (
        <>
          {/* month_start/end hidden for monthly — cover all months */}
          <input type="hidden" name="month_start" value="1" />
          <input type="hidden" name="month_end" value="12" />
          {targetScope !== 'trees' && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="stagger_by_row"
                name="stagger_by_row"
                value="true"
                defaultChecked={initial?.stagger_by_row ?? false}
                onChange={(e) => {
                  // keep the hidden field in sync
                  const hidden = e.currentTarget.form?.elements.namedItem('stagger_by_row_hidden') as HTMLInputElement | null
                  if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                }}
                className="mt-0.5"
              />
              <div>
                <label htmlFor="stagger_by_row" className="text-sm font-medium text-stone-800 cursor-pointer">
                  Stagger by row
                </label>
                <p className="text-xs text-stone-400 mt-0.5">
                  Spreads tasks across the month so each row is checked on a different day.
                </p>
              </div>
            </div>
          )}
          {targetScope === 'trees' && (
            <input type="hidden" name="stagger_by_row" value="false" />
          )}
        </>
      )}

      <div className="space-y-2">
        <Label>Applies to</Label>
        <div className="space-y-1.5">
          {(['all', 'rows', 'per_row', 'trees'] as const).map((scope) => (
            <label key={scope} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="target_scope"
                value={scope}
                checked={targetScope === scope}
                onChange={() => setTargetScope(scope)}
              />
              <span className="text-sm text-stone-800">{SCOPE_LABEL[scope]}</span>
            </label>
          ))}
        </div>

        {(targetScope === 'rows' || targetScope === 'per_row') && (
          <div className="ml-5 space-y-1.5 mt-2 border-l border-stone-200 pl-3">
            {rows.length === 0 && <p className="text-xs text-stone-400">No rows yet</p>}
            {rows.map((row) => (
              <label key={row.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRowIds.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                />
                <span className="text-sm text-stone-800">{row.label}</span>
              </label>
            ))}
            {targetScope === 'per_row' && (
              <p className="text-xs text-stone-400 mt-1">
                One task per row. Completing it logs the activity on the row and on every tree in that row.
              </p>
            )}
          </div>
        )}

        {targetScope === 'trees' && (
          <div className="ml-5 space-y-1.5 mt-2 border-l border-stone-200 pl-3 max-h-48 overflow-y-auto">
            {allTrees.length === 0 && <p className="text-xs text-stone-400">No trees yet</p>}
            {allTrees.map((tree) => {
              const row = rows.find((r) => r.id === tree.row_id)
              return (
                <label key={tree.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTreeIds.includes(tree.id)}
                    onChange={() => toggleTree(tree.id)}
                  />
                  <span className="text-sm text-stone-800">
                    {tree.variety ?? `Position ${tree.position}`}
                    <span className="text-stone-400"> · {row?.label}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving && (
            <svg className="animate-spin size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {initial ? 'Save changes' : 'Create template'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

interface TaskTemplateManagerProps {
  orchardId: string
  templates: TaskTemplate[]
  rows: Row[]
  allTrees: TreeWithLastLog[]
}

export function TaskTemplateManager({ orchardId, templates, rows, allTrees }: TaskTemplateManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id)
    await toggleTemplateActiveAction(id, !current)
    setTogglingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? Existing generated tasks will be kept but unlinked.')) return
    setDeletingId(id)
    await deleteTemplateAction(id)
    setDeletingId(null)
  }

  return (
    <div className="space-y-3">
      {templates.length === 0 && !showForm && (
        <p className="text-sm text-stone-400 py-4 text-center">No recurring task templates yet.</p>
      )}

      {templates.map((t) => (
        <div key={t.id}>
          {editingId === t.id ? (
            <TemplateForm
              orchardId={orchardId}
              rows={rows}
              allTrees={allTrees}
              initial={t}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className={`text-sm font-medium ${t.active ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                  {t.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    {scheduleLabel(t)}
                  </span>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    {targetLabel(t)}
                  </span>
                  {t.log_type && (
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">
                      Logs: {t.log_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(t.id, t.active)}
                  disabled={togglingId === t.id}
                  className={`text-xs px-2 py-1 rounded border transition-all ${
                    t.active
                      ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {t.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(t.id)}
                  className="text-xs px-2 py-1 rounded border border-stone-200 text-stone-500 hover:border-stone-300 transition-all"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showForm ? (
        <TemplateForm
          orchardId={orchardId}
          rows={rows}
          allTrees={allTrees}
          onDone={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-stone-200 rounded-lg text-sm text-stone-400 hover:text-stone-600 hover:border-stone-300 transition-colors"
        >
          + New recurring task
        </button>
      )}
    </div>
  )
}
