/**
 * Supabase Management API client
 * Fetches project data, compute sizes, and usage stats
 * Uses plain fetch since the Management API is REST, not PostgREST
 */

const BASE_URL = 'https://api.supabase.com/v1'

export interface SupabaseProject {
  id: string
  ref: string
  name: string
  status: string
  created_at: string
}

export interface ProjectAddons {
  addons: Array<{
    identifier: string
    name: string
    status: string
  }>
}

export interface ProjectUsage {
  logs: {
    count: number
  }
}

function getHeaders() {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN
  if (!token) {
    throw new Error('SUPABASE_MANAGEMENT_TOKEN not set')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function listProjects(): Promise<SupabaseProject[]> {
  const res = await fetch(`${BASE_URL}/projects`, { headers: getHeaders() })
  if (!res.ok) {
    const err = await res.text()
    console.error('[Supabase Management] Error listing projects:', err)
    throw new Error(`Failed to list projects: ${res.status}`)
  }
  return res.json()
}

export async function getProjectAddons(ref: string): Promise<ProjectAddons> {
  const res = await fetch(`${BASE_URL}/projects/${ref}/billing/addons`, { headers: getHeaders() })
  if (!res.ok) {
    console.error(`[Supabase Management] Error getting addons for ${ref}:`, res.status)
    return { addons: [] }
  }
  return res.json()
}

export async function getProjectUsage(ref: string): Promise<number> {
  try {
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
    
    const res = await fetch(
      `${BASE_URL}/projects/${ref}/analytics/endpoints/logs.all?start=${start.toISOString()}&end=${end.toISOString()}`,
      { headers: getHeaders() }
    )
    
    if (!res.ok) {
      return 0
    }
    
    const data: ProjectUsage = await res.json()
    return data.logs?.count || 0
  } catch (err) {
    console.error(`[Supabase Management] Error getting usage for ${ref}:`, err)
    return 0
  }
}

export function getComputeSizeFromAddons(addons: ProjectAddons): string {
  const computeAddon = addons.addons.find((a) => a.identifier?.startsWith('compute'))
  return computeAddon?.identifier?.replace('compute_', '') || 'micro'
}
