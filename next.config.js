const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },

  // Required so Windows builds don’t get cursed absolute paths
  outputFileTracingRoot: process.cwd(),
};

module.exports = nextConfig;
