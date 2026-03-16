import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const progress = Math.min(100, Math.max(0, Math.round(Number(body.progress) || 0)))

  const update: Record<string, unknown> = {
    reading_progress: progress,
    updated_at: new Date().toISOString(),
  }

  // Auto mark as read when progress hits 100%
  if (progress >= 100) {
    update.status = 'read'
  }

  const { error } = await supabase
    .from('inbox_items')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, progress })
}
