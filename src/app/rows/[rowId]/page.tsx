import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRowWithTrees } from '@/lib/db/rows'
import { RowDetail } from '@/components/orchard/RowDetail'

interface RowPageProps {
  params: { rowId: string }
  searchParams: { add?: string }
}

export default async function RowPage({ params, searchParams }: RowPageProps) {
  const row = await getRowWithTrees(params.rowId).catch(() => null)
  if (!row) notFound()

  const addAtPosition = searchParams.add ? parseInt(searchParams.add) : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/" className="hover:text-stone-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-stone-800">{row.label}</span>
      </div>

      <RowDetail row={row} addAtPosition={addAtPosition} />
    </div>
  )
}
