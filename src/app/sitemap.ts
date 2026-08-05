import { MetadataRoute } from 'next'
import { PLATFORMS } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://corporate-ai-solutions.vercel.app'
  
  // Archived from the sitemap 2026-08-05 alongside NAV_ITEMS (see src/lib/constants.ts) so the
  // single services message isn't diluted in search results by four competing price points:
  // /pricing, /engagement, /community, /studio, /studio/thesis, /studio/portfolio, /studio/join.
  // /pricing and /engagement 301 to /services (next.config.js); the rest are simply unlisted.
  const staticPages = [
    '',
    '/services',
    '/clients',
    '/marketplace',
    '/marketplace/cqr',
    '/voice-ai',
    '/solutions',
    '/contact',
    '/about',
  ]

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return staticRoutes
}
