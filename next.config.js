/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output configuration for Cloudflare Pages
  output: 'standalone',
  images: {
    unoptimized: true, // Required for Cloudflare Pages
  },
  // Experimental features for better Cloudflare compatibility
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig


