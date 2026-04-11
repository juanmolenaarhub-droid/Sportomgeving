import { createClient } from '@supabase/supabase-js'

// Service role client — bypast RLS, alleen gebruiken in server-side admin code
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  // Fallback: anon key (beperkt door RLS — vul SUPABASE_SERVICE_ROLE_KEY in voor volledige data)
  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
}
