'use client'

import { useState, useMemo } from 'react'
import { RowHeader } from './RowHeader'
import { RowGrid } from './RowGrid'
import { Input } from '@/components/ui/input'
import type { RowWithTrees, TreeCondition } from '@/types/orchard'

interface DashboardGridProps {
  rows: RowWithTrees[]
}

const CONDITIONS: TreeCondition[] = ['good', 'fair', 'poor', 'dead']

export function DashboardGrid({ rows }: DashboardGridProps) {
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState<Set<TreeCondition>>(new Set())
  const [speciesFilter, setSpeciesFilter] = useState<Set<string>>(new Set())

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

      {/* Filtered row grids */}
      {filteredRows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-sm">No trees match your filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredRows.map((row) => (
            <section key={row.id} className="space-y-3">
              <RowHeader row={row} showLink />
              <RowGrid row={row} compact />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
