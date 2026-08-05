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
      // Message consolidation 2026-08-05 — the site offered four price points across four pages
      // and a buyer could not tell what was for sale. Everything commercial now lands on
      // /services. These are TEMPORARY (307) on purpose: `permanent: true` is cached hard by
      // browsers and would make restoring /pricing or /engagement painful. Flip to `true` only
      // once the consolidation is settled.
      {
        source: '/pricing',
        destination: '/services',
        permanent: false,
      },
      {
        source: '/engagement',
        destination: '/services',
        permanent: false,
      },
      {
        source: '/partner',
        destination: '/services',
        permanent: false,
      },
      {
        source: '/studio/partner',
        destination: '/services',
        permanent: false,
      },
      {
        source: '/studio-partner',
        destination: '/services',
        permanent: false,
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
