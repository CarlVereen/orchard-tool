import { createClient } from '@/lib/supabase/server'
import type { TreeNote } from '@/types/orchard'

export async function getNotesByTree(treeId: string): Promise<TreeNote[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_notes')
    .select('*')
    .eq('tree_id', treeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createNote(treeId: string, content: string): Promise<TreeNote> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_notes')
    .insert({ tree_id: treeId, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(id: string, content: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tree_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tree_notes').delete().eq('id', id)
  if (error) throw error
}
