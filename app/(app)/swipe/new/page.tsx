'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AdType = 'image' | 'video' | 'text' | 'url'

const adTypeOptions: { type: AdType; icon: string; label: string }[] = [
  { type: 'image', icon: '📸', label: 'Screenshot' },
  { type: 'video', icon: '🎬', label: 'Video' },
  { type: 'text', icon: '📝', label: 'Text' },
  { type: 'url', icon: '🔗', label: 'URL' },
]

const platforms = ['facebook', 'tiktok', 'google', 'instagram', 'youtube', 'other']
const categories = ['hook', 'cta', 'visual', 'offer', 'other']

export default function NewSwipePage() {
  const [adType, setAdType] = useState<AdType | null>(null)
  const [title, setTitle] = useState('')
  const [contentText, setContentText] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [platform, setPlatform] = useState('')
  const [category, setCategory] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adType || !platform || !category) return
    setLoading(true)
    setError('')

    let imagePath = null

    if (adType === 'image' && imageFile) {
      const formData = new FormData()
      formData.append('file', imageFile)
      const res = await fetch('/api/swipe/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error)
        setLoading(false)
        return
      }
      imagePath = result.path
    }

    const { data, error: insertError } = await supabase
      .from('swipe_items')
      .insert({
        title: title || null,
        ad_type: adType,
        content_text: adType === 'text' ? contentText : null,
        content_url: adType === 'video' || adType === 'url' ? contentUrl : null,
        image_path: imagePath,
        platform,
        category,
        tags,
        notes: notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push(`/swipe/${data.id}`)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 -ml-2 text-gray-700 dark:text-gray-300"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Ad</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>
      )}

      {/* Step 1: Choose ad type */}
      {!adType ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose ad type:</p>
          <div className="grid grid-cols-2 gap-3">
            {adTypeOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setAdType(opt.type)}
                className="p-6 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl active:border-blue-400 active:bg-blue-50 dark:active:bg-blue-900/30 text-center"
              >
                <span className="text-3xl block mb-2">{opt.icon}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Change type link */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdType(null)}
              className="text-sm text-gray-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5 mr-1">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Change type
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
              {adType}
            </span>
          </div>

          {/* Type-specific fields */}
          {adType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upload Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-3 max-h-48 rounded-xl" />
              )}
            </div>
          )}

          {adType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Video URL</label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {adType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ad Content</label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                placeholder="Paste ad content here..."
              />
            </div>
          )}

          {adType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ad URL</label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                placeholder="https://..."
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Memorable name for this ad"
            />
          </div>

          {/* Platform + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Platform <span className="text-red-400">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white capitalize text-sm"
              >
                <option value="">Select</option>
                {platforms.map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white capitalize text-sm"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-gray-400 ml-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                placeholder="Type a tag and press Enter"
              />
              <button type="button" onClick={addTag} className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl active:bg-gray-200 dark:active:bg-gray-600 text-sm font-medium">
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Why is this ad good? What's worth learning?"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl active:bg-gray-200 dark:active:bg-gray-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
