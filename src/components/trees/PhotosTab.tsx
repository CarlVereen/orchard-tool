'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { addPhotoMetaAction, deletePhotoAction } from '@/lib/actions/orchard'
import type { TreePhoto } from '@/types/orchard'

interface PhotosTabProps {
  treeId: string
  initialPhotos: TreePhoto[]
}

function getPublicUrl(storagePath: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('tree-photos').getPublicUrl(storagePath)
  return data.publicUrl
}

export function PhotosTab({ treeId, initialPhotos }: PhotosTabProps) {
  const [photos, setPhotos] = useState<TreePhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [viewPhoto, setViewPhoto] = useState<TreePhoto | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${treeId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('tree-photos').upload(path, file)
      if (error) throw error
      const photo = await addPhotoMetaAction(treeId, path)
      setPhotos((prev) => [photo, ...prev])
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(photo: TreePhoto) {
    await deletePhotoAction(photo.id, photo.storage_path, treeId)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    setConfirmDelete(null)
    if (viewPhoto?.id === photo.id) setViewPhoto(null)
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              Add Photo
            </>
          )}
        </button>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-8">No photos yet. Tap Add Photo to take one.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-100 cursor-pointer group"
              onClick={() => setViewPhoto(photo)}
            >
              <Image
                src={getPublicUrl(photo.storage_path)}
                alt={photo.caption ?? 'Tree photo'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              {/* Delete overlay */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(photo.id) }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/40 px-2 py-1">
                  <p className="text-[10px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[80vh] aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getPublicUrl(viewPhoto.storage_path)}
              alt={viewPhoto.caption ?? 'Tree photo'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
          <button
            type="button"
            onClick={() => setViewPhoto(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-3">
            <p className="font-medium text-stone-800">Delete this photo?</p>
            <p className="text-sm text-stone-500">This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const photo = photos.find((p) => p.id === confirmDelete)
                  if (photo) handleDelete(photo)
                }}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:border-stone-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
