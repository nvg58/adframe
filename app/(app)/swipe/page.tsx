import { createClient } from '@/lib/supabase/server'
import SwipeList from './SwipeList'

export default async function SwipePage({
  searchParams,
}: {
  searchParams: { platform?: string; category?: string; tag?: string }
}) {
  const supabase = createClient()
  let query = supabase
    .from('swipe_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.platform) {
    query = query.eq('platform', searchParams.platform)
  }
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }
  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }

  const { data: items, error } = await query

  // Generate signed URLs for image items
  const itemsWithUrls = await Promise.all(
    (items || []).map(async (item) => {
      if (item.ad_type === 'image' && item.image_path) {
        const { data } = await supabase.storage
          .from('swipe-images')
          .createSignedUrl(item.image_path, 3600)
        return { ...item, image_url: data?.signedUrl || null }
      }
      return { ...item, image_url: null }
    })
  )

  return (
    <SwipeList
      items={itemsWithUrls}
      error={error?.message}
      currentPlatform={searchParams.platform || ''}
      currentCategory={searchParams.category || ''}
    />
  )
}
