import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: http://localhost:* https://imagiq-backend-production.up.railway.app https://www.clarity.ms https://*.clarity.ms https://scripts.clarity.ms https://plugins.stripo.email https://editor.stripo.email https://cdn.jsdelivr.net https://*.devtunnels.ms https://*.use.devtunnels.ms",
              "connect-src 'self' http://localhost:* https://imagiq-backend-production.up.railway.app https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://res.cloudinary.com https://*.cloudinary.com https://plugins.stripo.email wss://plugins.stripo.email wss://*.stripo.email https://raw.githubusercontent.com https://cdn.jsdelivr.net https://*.devtunnels.ms https://*.use.devtunnels.ms",
              "img-src 'self' data: blob: https: http://localhost:* https://www.clarity.ms https://*.clarity.ms https://res.cloudinary.com https://*.cloudinary.com https://*.devtunnels.ms",
              "media-src 'self' blob: data: https://res.cloudinary.com https://*.cloudinary.com http://localhost:* https://*.devtunnels.ms",
              "style-src 'self' 'unsafe-inline' https://plugins.stripo.email https://*.devtunnels.ms",
              "font-src 'self' data: https://*.devtunnels.ms",
              "frame-src 'self' * https://plugins.stripo.email https://editor.stripo.email https://*.devtunnels.ms",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
