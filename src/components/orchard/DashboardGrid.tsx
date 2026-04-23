'use client'

import { useState, useMemo, useEffect } from 'react'
import { RowHeader } from './RowHeader'
import { RowGrid } from './RowGrid'
import { Input } from '@/components/ui/input'
import type { RowWithTrees, TreeCondition } from '@/types/orchard'

const EXPANDED_ROWS_STORAGE_KEY = 'orchard:expandedRows'

interface DashboardGridProps {
  rows: RowWithTrees[]
}

const CONDITIONS: TreeCondition[] = ['good', 'fair', 'poor', 'dead']

export function DashboardGrid({ rows }: DashboardGridProps) {
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState<Set<TreeCondition>>(new Set())
  const [speciesFilter, setSpeciesFilter] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Load persisted expanded state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_ROWS_STORAGE_KEY)
      if (raw) setExpandedIds(new Set(JSON.parse(raw) as string[]))
    } catch {
      // ignore malformed storage
    }
  }, [])

  function toggleRowExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try {
        localStorage.setItem(EXPANDED_ROWS_STORAGE_KEY, JSON.stringify(Array.from(next)))
      } catch {
        // ignore storage failures
      }
      return next
    })
  }

  function setAllExpanded(expanded: boolean) {
    const next = expanded ? new Set(rows.map((r) => r.id)) : new Set<string>()
    setExpandedIds(next)
    try {
      localStorage.setItem(EXPANDED_ROWS_STORAGE_KEY, JSON.stringify(Array.from(next)))
    } catch {
      // ignore storage failures
    }
  }

  // Derive unique species from all trees
  const allSpecies = useMemo(() => {
    const set = new Set<string>()
    for (const row of rows) {
      for (const tree of row.trees) {
        if (tree.species) set.add(tree.species)
      }
    }
    return Array.from(set).sort()
  }, [rows])

  const hasActiveFilter = search.length > 0 || conditionFilter.size > 0 || speciesFilter.size > 0

  // Filter rows and their trees client-side
  const filteredRows = useMemo(() => {
    if (!hasActiveFilter) return rows

    const q = search.toLowerCase()

    return rows
      .map((row) => {
        const filteredTrees = row.trees.filter((tree) => {
          // Text search on variety or species
          if (q) {
            const variety = (tree.variety ?? '').toLowerCase()
            const species = (tree.species ?? '').toLowerCase()
            if (!variety.includes(q) && !species.includes(q)) return false
          }
          // Condition filter
          if (conditionFilter.size > 0 && !conditionFilter.has(tree.condition)) return false
          // Species filter
          if (speciesFilter.size > 0 && (!tree.species || !speciesFilter.has(tree.species))) return false
          return true
        })
        return { ...row, trees: filteredTrees }
      })
      .filter((row) => row.trees.length > 0)
  }, [rows, search, conditionFilter, speciesFilter, hasActiveFilter])

  function toggleCondition(c: TreeCondition) {
    setConditionFilter((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  function toggleSpecies(s: string) {
    setSpeciesFilter((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function clearAll() {
    setSearch('')
    setConditionFilter(new Set())
    setSpeciesFilter(new Set())
  }

  const matchCount = filteredRows.reduce((acc, r) => acc + r.trees.length, 0)
  const totalCount = rows.reduce((acc, r) => acc + r.trees.length, 0)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by variety or species..."
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Condition chips */}
        {CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCondition(c)}
            className={`
              rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize
              ${conditionFilter.has(c)
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
              }
            `}
          >
            {c}
          </button>
        ))}

        {/* Species chips (only when 2+ species exist) */}
        {allSpecies.length >= 2 && (
          <>
            <span className="w-px h-4 bg-stone-200" />
            {allSpecies.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecies(s)}
                className={`
                  rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize
                  ${speciesFilter.has(s)
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                  }
                `}
              >
                {s}
              </button>
            ))}
          </>
        )}

        {/* Clear + match count */}
        {hasActiveFilter && (
          <>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors ml-1"
            >
              Clear filters
            </button>
            <span className="text-xs text-stone-400 ml-auto">
              {matchCount} of {totalCount} trees
            </span>
          </>
        )}
      </div>

      {/* Expand / collapse all */}
      {filteredRows.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAllExpanded(expandedIds.size < rows.length)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            {expandedIds.size < rows.length ? 'Expand all' : 'Collapse all'}
          </button>
        </div>
      )}

      {/* Filtered row grids */}
      {filteredRows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-sm">No trees match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => {
            // When a filter is active, always show matching trees; otherwise honor per-row toggle.
            const expanded = hasActiveFilter || expandedIds.has(row.id)
            return (
              <section key={row.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleRowExpanded(row.id)}
                    disabled={hasActiveFilter}
                    aria-expanded={expanded}
                    aria-controls={`row-grid-${row.id}`}
                    aria-label={expanded ? `Collapse ${row.label}` : `Expand ${row.label}`}
                    className="w-8 h-8 -m-2 flex items-center justify-center shrink-0 rounded hover:bg-stone-50 disabled:hover:bg-transparent transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <RowHeader row={row} showLink />
                  </div>
                </div>
                {expanded && (
                  <div id={`row-grid-${row.id}`} className="border-t border-stone-100 p-4">
                    <RowGrid row={row} compact />
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
