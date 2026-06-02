/**
 * Vercel API client for deployment costs
 */

const BASE_URL = 'https://api.vercel.com'

function getHeaders() {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN not set')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

export interface VercelProject {
  id: string
  name: string
}

export interface VercelDeployment {
  uid: string
  name: string
  state: string
  created: number
}

export interface VercelUsage {
  bandwidth: number
  functionInvocations: number
  buildSeconds: number
}

export async function listProjects(): Promise<VercelProject[]> {
  const res = await fetch(`${BASE_URL}/v6/projects`, { headers: getHeaders() })
  if (!res.ok) {
    console.error('[Vercel] Error listing projects:', res.status)
    return []
  }
  const data = await res.json()
  return data.projects || []
}

export async function getProjectUsage(projectId: string): Promise<VercelUsage> {
  try {
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
    
    const res = await fetch(
      `${BASE_URL}/v6/projects/${projectId}/usage?start=${start.toISOString()}&end=${end.toISOString()}`,
      { headers: getHeaders() }
    )
    
    if (!res.ok) {
      return { bandwidth: 0, functionInvocations: 0, buildSeconds: 0 }
    }
    
    const data = await res.json()
    return {
      bandwidth: data.bandwidth?.total || 0,
      functionInvocations: data.invocations?.total || 0,
      buildSeconds: data.builds?.total || 0,
    }
  } catch (err) {
    console.error(`[Vercel] Error getting usage for ${projectId}:`, err)
    return { bandwidth: 0, functionInvocations: 0, buildSeconds: 0 }
  }
}

export async function listDeployments(projectId: string): Promise<VercelDeployment[]> {
  const res = await fetch(`${BASE_URL}/v6/deployments?projectId=${projectId}&limit=10`, { headers: getHeaders() })
  if (!res.ok) {
    return []
  }
  const data = await res.json()
  return data.deployments || []
}
