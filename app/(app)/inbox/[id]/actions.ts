'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function markAsRead(formData: FormData) {
  const id = formData.get('id') as string
  const newStatus = formData.get('newStatus') as string

  const supabase = createClient()
  await supabase.from('inbox_items').update({ status: newStatus }).eq('id', id)
  redirect(`/inbox/${id}`)
}

export async function deleteItem(formData: FormData) {
  const id = formData.get('id') as string

  const supabase = createClient()
  await supabase.from('inbox_items').delete().eq('id', id)
  redirect('/inbox')
}

export async function exportItem(formData: FormData) {
  const id = formData.get('id') as string

  const supabase = createClient()
  const { data: item } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) redirect(`/inbox/${id}`)

  // Redirect to export page with text
  redirect(`/inbox/${id}?export=true`)
}
