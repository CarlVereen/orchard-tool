import { createClient } from '@/lib/supabase/server'
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

/** Returns a signed URL for a photo stored in Supabase Storage (1 hour expiry) */
export async function getSignedPhotoUrl(storagePath: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('tree-photos')
    .createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

/** Batch-generate signed URLs for multiple photos */
export async function getSignedPhotoUrls(storagePaths: string[]): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map()
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('tree-photos')
    .createSignedUrls(storagePaths, 3600)
  if (error) throw error
  const urlMap = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) urlMap.set(item.path, item.signedUrl)
  }
  return urlMap
}
