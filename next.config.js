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
        source: '/invest',
        destination: '/invest-in-the-future-of-ai',
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
