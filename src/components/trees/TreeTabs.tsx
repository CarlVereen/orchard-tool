'use client'

import { useState } from 'react'
import { LogList } from './LogList'
import { NotesList } from './NotesList'
import { PhotosTab } from './PhotosTab'
import type { Log, TreeNote, TreePhoto } from '@/types/orchard'

type Tab = 'activity' | 'notes' | 'photos'

interface TreeTabsProps {
  treeId: string
  logs: Log[]
  notes: TreeNote[]
  photos: TreePhoto[]
  addLogButton: React.ReactNode
}

export function TreeTabs({ treeId, logs, notes, photos, addLogButton }: TreeTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('activity')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'activity', label: 'Activity', count: logs.length },
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
              <span className="ml-1.5 text-xs text-stone-400">({tab.count})</span>
            )}
          </button>
        ))}
        {activeTab === 'activity' && (
          <div className="ml-auto pb-1">{addLogButton}</div>
        )}
      </div>

      {/* Panels */}
      {activeTab === 'activity' && <LogList logs={logs} />}
      {activeTab === 'notes' && <NotesList notes={notes} treeId={treeId} />}
      {activeTab === 'photos' && <PhotosTab treeId={treeId} initialPhotos={photos} />}
    </div>
  )
}
