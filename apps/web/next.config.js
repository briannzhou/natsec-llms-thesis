/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@event-monitor/shared'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
