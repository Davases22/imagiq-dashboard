import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://imagiq-backend-production.up.railway.app https://www.clarity.ms https://*.clarity.ms https://scripts.clarity.ms https://plugins.stripo.email https://*.stripo.email https://editor.unlayer.com https://*.unlayer.com",
              "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://imagiq-backend-production.up.railway.app https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://res.cloudinary.com https://*.cloudinary.com https://plugins.stripo.email https://*.stripo.email https://*.stripocdn.email wss://plugins.stripo.email wss://*.stripo.email https://api.unlayer.com https://*.unlayer.com",
              "img-src 'self' data: blob: https: http://localhost:* https://www.clarity.ms https://*.clarity.ms https://res.cloudinary.com https://*.cloudinary.com https://*.stripo.email https://*.stripocdn.email https://*.unlayer.com",
              "media-src 'self' blob: data: https://res.cloudinary.com https://*.cloudinary.com http://localhost:*",
              "style-src 'self' 'unsafe-inline' https://plugins.stripo.email https://*.stripo.email https://*.unlayer.com",
              "font-src 'self' data: https://*.stripo.email https://*.stripocdn.email https://*.unlayer.com",
              "frame-src 'self' * https://*.stripo.email https://*.unlayer.com",
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
