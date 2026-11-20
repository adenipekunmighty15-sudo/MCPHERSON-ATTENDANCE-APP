/** @type {import('next').NextConfig} */

// Server-only. The browser keeps calling same-origin /api and /uploads, so
// streaming (SSE) responses and multipart upload bodies pass through Next's
// proxy untouched. The local /api/health route is resolved before afterFiles
// rewrites and keeps working.
const apiOrigin = process.env.API_ORIGIN?.replace(/\/+$/, '')

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiOrigin) return []
    return {
      beforeFiles: [],
      afterFiles: [
        { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
        { source: '/uploads/:path*', destination: `${apiOrigin}/uploads/:path*` },
      ],
      fallback: [],
    }
  },
}

export default nextConfig
