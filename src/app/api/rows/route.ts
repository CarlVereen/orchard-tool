import { NextResponse } from 'next/server'
import { getRows } from '@/lib/db/rows'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orchardId = searchParams.get('orchardId')
  if (!orchardId) return NextResponse.json([], { status: 400 })
  const rows = await getRows(orchardId)
  return NextResponse.json(rows)
}
