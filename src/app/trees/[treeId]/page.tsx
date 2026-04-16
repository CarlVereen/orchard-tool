import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTree, getTreeSummary } from '@/lib/db/trees'
import { getLogsForTree } from '@/lib/db/logs'
import { getNotesByTree } from '@/lib/db/notes'
import { getPhotosByTree } from '@/lib/db/photos'
import { getRows } from '@/lib/db/rows'
import { getTasksForTree } from '@/lib/db/tasks'
import { createClient } from '@/lib/supabase/server'
import { TreeInfoCard } from '@/components/trees/TreeInfoCard'
import { TreeSummaryStrip } from '@/components/trees/TreeSummaryStrip'
import { TreeTabs } from '@/components/trees/TreeTabs'
import { AddLogSheet } from '@/components/logs/AddLogSheet'

interface TreePageProps {
  params: { treeId: string }
}

export default async function TreePage({ params }: TreePageProps) {
  const tree = await getTree(params.treeId).catch(() => null)
  if (!tree) notFound()

  const rowData = await createClient()
    .from('rows')
    .select('id, label, orchard_id')
    .eq('id', tree.row_id)
    .single()
    .then((r) => r.data)

  const rowLabel = rowData?.label ?? 'Row'
  const rowId = rowData?.id ?? tree.row_id
  const orchardId = rowData?.orchard_id ?? ''

  const [logs, notes, photos, allRows, summary, tasks] = await Promise.all([
    getLogsForTree(tree.id),
    getNotesByTree(tree.id),
    getPhotosByTree(tree.id),
    getRows(orchardId),
    getTreeSummary(tree.id, tree.watering_cycle_days),
    getTasksForTree(tree.id),
  ])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/" className="hover:text-stone-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/rows/${rowId}`} className="hover:text-stone-600 transition-colors">{rowLabel}</Link>
        <span>/</span>
        <span className="text-stone-800">{tree.variety ?? `Position ${tree.position}`}</span>
      </div>

      {/* Summary strip */}
      <TreeSummaryStrip summary={summary} />

      {/* Info card (edit includes danger zone) */}
      <TreeInfoCard tree={tree} rowLabel={rowLabel} rowId={rowId} orchardId={orchardId} allRows={allRows} />

      {/* Tabs: Activity / Tasks / Notes / Photos */}
      <TreeTabs
        treeId={tree.id}
        rowId={rowId}
        logs={logs}
        notes={notes}
        photos={photos}
        tasks={tasks}
        addLogButton={
          <AddLogSheet treeId={tree.id} rowId={rowId} treeName={tree.variety ?? undefined} />
        }
      />
    </div>
  )
}
