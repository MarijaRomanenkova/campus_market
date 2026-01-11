/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      },
    ],
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks', 'types', 'prisma', 'email'],
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
