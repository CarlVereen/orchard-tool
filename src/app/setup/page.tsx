import { redirect } from 'next/navigation'
import { getOrchard } from '@/lib/db/orchards'
import { getRows } from '@/lib/db/rows'
import { SetupForm } from '@/components/SetupForm'
import { ManageRowsForm } from '@/components/orchard/ManageRowsForm'

export default async function SetupPage() {
  const orchard = await getOrchard()

  // First-time setup: no orchard yet
  if (!orchard) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <h1 className="text-2xl font-semibold text-stone-800 mb-2">Welcome to Orchard Tool</h1>
        <p className="text-stone-500 mb-8">Let's get your orchard set up.</p>
        <SetupForm />
      </div>
    )
  }

  const rows = await getRows(orchard.id)

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-800 mb-1">Settings</h1>
      <p className="text-stone-500 mb-8">Manage your orchard and rows.</p>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Orchard</h2>
        <SetupForm orchard={orchard} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Rows</h2>
        <ManageRowsForm orchard={orchard} rows={rows} />
      </section>
    </div>
  )
}
