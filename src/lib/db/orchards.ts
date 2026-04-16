import { createClient } from '@/lib/supabase/server'
import type { Orchard } from '@/types/orchard'

export async function getOrchard(): Promise<Orchard | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('orchards')
    .select('*')
    .limit(1)
    .single()
  return data
}

export async function createOrchard(name: string, description?: string): Promise<Orchard> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orchards')
    .insert({ name, description: description ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOrchard(id: string, updates: Partial<Pick<Orchard, 'name' | 'description'>>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orchards')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}
