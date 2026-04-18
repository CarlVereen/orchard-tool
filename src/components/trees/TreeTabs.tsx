'use client'

import { useState } from 'react'
import { LogList } from './LogList'
import { NotesList } from './NotesList'
import { PhotosTab } from './PhotosTab'
import { TreeTasks } from './TreeTasks'
import type { Log, LogType, TreeNote, TreePhoto, TreeTask, ProjectTask } from '@/types/orchard'

type Tab = 'activity' | 'tasks' | 'notes' | 'photos'
type LogFilter = LogType | 'all'

const LOG_FILTERS: { id: LogFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'water', label: 'Water' },
  { id: 'fertilize', label: 'Fertilize' },
  { id: 'production', label: 'Harvest' },
  { id: 'prune', label: 'Prune' },
  { id: 'scout', label: 'Scout' },
  { id: 'note', label: 'Note' },
]

interface TreeTabsProps {
  treeId: string
  rowId: string
  logs: Log[]
  notes: TreeNote[]
  photos: TreePhoto[]
  photoUrls: Record<string, string>
  tasks: TreeTask[]
  projectTasks: ProjectTask[]
  addLogButton: React.ReactNode
}

export function TreeTabs({ treeId, rowId, logs, notes, photos, photoUrls, tasks, projectTasks, addLogButton }: TreeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('activity')
  const [logTypeFilter, setLogTypeFilter] = useState<LogFilter>('all')

  const filteredLogs = logTypeFilter === 'all' ? logs : logs.filter((l) => l.log_type === logTypeFilter)

  const pendingTaskCount = tasks.filter((t) => !t.completed_at).length + projectTasks.filter((t) => !t.completed_at).length

  const tabs: { id: Tab; label: string; count?: number; highlight?: boolean }[] = [
    { id: 'activity', label: 'Activity', count: logs.length },
    { id: 'tasks', label: 'Tasks', count: pendingTaskCount, highlight: pendingTaskCount > 0 },
    { id: 'notes', label: 'Notes', count: notes.length },
    { id: 'photos', label: 'Photos', count: photos.length },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center border-b border-stone-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-stone-800 text-stone-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${tab.highlight ? 'text-red-400' : 'text-stone-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
        {activeTab === 'activity' && (
          <div className="ml-auto pb-1">{addLogButton}</div>
        )}
      </div>

      {/* Panels */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {LOG_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLogTypeFilter(f.id)}
                className={`
                  rounded-full px-3 py-1 text-xs font-medium transition-colors
                  ${logTypeFilter === f.id
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                  }
                `}
              >
                {f.label}
                {f.id !== 'all' && (() => {
                  const c = logs.filter((l) => l.log_type === f.id).length
                  return c > 0 ? <span className="ml-1 opacity-60">({c})</span> : null
                })()}
              </button>
            ))}
          </div>
          <LogList logs={filteredLogs} />
        </div>
      )}
      {activeTab === 'tasks' && <TreeTasks treeId={treeId} rowId={rowId} initialTasks={tasks} projectTasks={projectTasks} />}
      {activeTab === 'notes' && <NotesList notes={notes} treeId={treeId} />}
      {activeTab === 'photos' && <PhotosTab treeId={treeId} initialPhotos={photos} initialPhotoUrls={photoUrls} />}
    </div>
  )
}
