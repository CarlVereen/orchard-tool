import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { TreePhoto } from '@/types/orchard'

export async function getPhotosByTree(treeId: string): Promise<TreePhoto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_photos')
    .select('*')
    .eq('tree_id', treeId)
    .order('taken_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPhoto(
  treeId: string,
  storagePath: string,
  caption?: string
): Promise<TreePhoto> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tree_photos')
    .insert({ tree_id: treeId, storage_path: storagePath, caption: caption ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(id: string, storagePath: string): Promise<void> {
  const supabase = createClient()
  // Delete from storage first
  await supabase.storage.from('tree-photos').remove([storagePath])
  // Then remove the DB row
  const { error } = await supabase.from('tree_photos').delete().eq('id', id)
  if (error) throw error
}

/** Returns the public URL for a photo stored in Supabase Storage */
export function getPhotoUrl(storagePath: string): string {
  const supabase = createBrowserClient()
  const { data } = supabase.storage.from('tree-photos').getPublicUrl(storagePath)
  return data.publicUrl
}
