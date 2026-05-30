import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const getSupabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

const createSupabaseClient = (serviceRole = false): SupabaseClient => {
  const url = getSupabaseUrl()
  const key = serviceRole ? getSupabaseServiceKey() : getSupabaseAnonKey()
  
  if (!url || !key) {
    throw new Error(`supabaseKey is required. Set NEXT_PUBLIC_SUPABASE_URL and ${serviceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'}`)
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

// Export a lazy proxy that works like the old object
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createSupabaseClient(false)
    }
    return (_supabase as any)[prop]
  }
})

// Server-side client with service role (for API routes)
export const supabaseAdmin = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseClient(true)
  }
  return _supabaseAdmin
}
