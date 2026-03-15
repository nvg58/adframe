'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteInboxItem(formData: FormData) {
  const id = formData.get('id') as string

  const supabase = createClient()
  await supabase.from('inbox_items').delete().eq('id', id)
  redirect('/inbox')
}
