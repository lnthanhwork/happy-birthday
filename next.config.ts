import type { NextConfig } from "next";
const isProd = process.env.NODE_ENV === 'production';
console.log(isProd ? 'Production build' : 'Development build');
const repoName = 'happy-birthday'; 

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // Only apply basePath and assetPrefix in production (GitHub Pages)
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  experimental: {
    agentFeedback: true,
    ppr: false
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
