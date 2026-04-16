import type { NextConfig } from "next";

const securityHeaders = [
  // DNS prefetch voor betere performance
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Voorkomt dat de site in een iframe geladen wordt (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Voorkomt MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Schakelt XSS-filter in oudere browsers in
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Stuurt geen referrer info naar externe sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Staat alleen HTTPS toe (na eerste bezoek)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Beperkt welke functies de browser mag gebruiken
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig;
