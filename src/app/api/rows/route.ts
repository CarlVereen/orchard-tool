import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRows } from '@/lib/db/rows'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orchardId = searchParams.get('orchardId')
  if (!orchardId) return NextResponse.json([], { status: 400 })
  const rows = await getRows(orchardId)
  return NextResponse.json(rows)
}
