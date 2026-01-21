/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@event-monitor/shared'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    // Required for mapbox-gl
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
    };
    return config;
  },
};

module.exports = nextConfig;
