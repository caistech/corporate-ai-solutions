/**
 * LLM API clients for token usage tracking
 * Supports: Anthropic, OpenAI, OpenRouter
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1'
const OPENAI_API = 'https://api.openai.com/v1'
const OPENROUTER_API = 'https://openrouter.ai/api/v1'

// Anthropic
export async function getAnthropicUsage(): Promise<{ tokens: number; cost: number }> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { tokens: 0, cost: 0 }
  
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    const res = await fetch(
      `${ANTHROPIC_API}/organizations/self/usage?start_date=${startOfMonth}&end_date=${now.toISOString().split('T')[0]}`,
      {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
      }
    )
    
    if (!res.ok) {
      return { tokens: 0, cost: 0 }
    }
    
    const data = await res.json()
    return {
      tokens: data.tokens || 0,
      cost: data.cost_usd || 0,
    }
  } catch (err) {
    console.error('[Anthropic] Usage error:', err)
    return { tokens: 0, cost: 0 }
  }
}

// OpenAI
export async function getOpenAIUsage(): Promise<{ tokens: number; cost: number }> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { tokens: 0, cost: 0 }
  
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startDate = startOfMonth.toISOString().split('T')[0]
    
    const res = await fetch(
      `${OPENAI_API}/usage?start_date=${startDate}&end_date=${now.toISOString().split('T')[0]}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      }
    )
    
    if (!res.ok) {
      return { tokens: 0, cost: 0 }
    }
    
    const data = await res.json()
    const usage = data.data?.[0]?.usages?.[0] || {}
    return {
      tokens: usage.n_tokens_used || 0,
      cost: (usage.n_tokens_used || 0) * 0.00001, // Approximate
    }
  } catch (err) {
    console.error('[OpenAI] Usage error:', err)
    return { tokens: 0, cost: 0 }
  }
}

// OpenRouter
export async function getOpenRouterUsage(): Promise<{ tokens: number; cost: number }> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return { tokens: 0, cost: 0 }
  
  try {
    const res = await fetch(`${OPENROUTER_API}/usage`, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })
    
    if (!res.ok) {
      return { tokens: 0, cost: 0 }
    }
    
    const data = await res.json()
    return {
      tokens: data.data?.total_tokens || 0,
      cost: data.data?.total_cost || 0,
    }
  } catch (err) {
    console.error('[OpenRouter] Usage error:', err)
    return { tokens: 0, cost: 0 }
  }
}
