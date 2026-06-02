/**
 * Supabase compute size to monthly cost lookup
 * Rates from Supabase pricing (as of 2026)
 * Hourly rate × 730 = monthly estimate
 */

export const COMPUTE_PRICING: Record<string, number> = {
  nano: 0.0082 * 730,    // ~$5.99/mo
  micro: 0.0133 * 730,   // ~$9.68/mo
  small: 0.0397 * 730,   // ~$28.98/mo
  medium: 0.0795 * 730,  // ~$58.04/mo
  large: 0.1590 * 730,   // ~$116.07/mo
  xlarge: 0.3180 * 730,  // ~$232.14/mo
  xxlarge: 0.6360 * 730, // ~$464.28/mo
}

export const DEFAULT_COMPUTE_COST = COMPUTE_PRICING.micro

export function monthlyComputeUsd(size: string | null): number {
  if (!size) return DEFAULT_COMPUTE_COST
  return COMPUTE_PRICING[size.toLowerCase()] || DEFAULT_COMPUTE_COST
}
