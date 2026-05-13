/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  assetPrefix: '.',
  basePath: '/forge',
  images: { unoptimized: true },
};

module.exports = nextConfig;
