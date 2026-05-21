/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['corporateaisolutions.com', 'assets.skool.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/partner',
        destination: '/engagement',
        permanent: true,
      },
      {
        source: '/studio/partner',
        destination: '/engagement',
        permanent: true,
      },
      {
        source: '/studio-partner',
        destination: '/engagement',
        permanent: true,
      },
      // Long Tail Venture Studio LP surfaces retired 2026-05-19 — see
      // docs/BYOK_PIVOT_REQUIREMENTS.md. SEO equity from these URLs lands
      // on /about (the founder narrative) rather than 404-ing.
      {
        source: '/invest',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/invest-in-the-future-of-ai',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/studio/invest',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/deck',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/launchstack',
        destination: '/marketplace',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/resume',
        destination: '/resume.html',
      },
    ]
  },
}

module.exports = nextConfig
