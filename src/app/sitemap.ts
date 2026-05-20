import { MetadataRoute } from 'next'
import { PLATFORMS } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://corporateaisolutions.com'
  
  const staticPages = [
    '',
    '/marketplace',
    '/marketplace/cqr',
    '/pricing',
    '/community',
    '/contact',
    '/voice-ai',
    '/studio',
    '/studio/thesis',
    '/studio/portfolio',
    '/studio/join',
    '/engagement',
    '/clients',
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
