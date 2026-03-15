import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SwipeDetail from './SwipeDetail'

export default async function SwipeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: item, error } = await supabase
    .from('swipe_items')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !item) {
    notFound()
  }

  let imageUrl: string | null = null
  if (item.ad_type === 'image' && item.image_path) {
    const { data } = await supabase.storage
      .from('swipe-images')
      .createSignedUrl(item.image_path, 3600)
    imageUrl = data?.signedUrl || null
  }

  return <SwipeDetail item={{ ...item, image_url: imageUrl }} />
}
