/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@obsidian/ui', '@obsidian/types', '@obsidian/utils'],
  
  // Explicitly expose the NEXTAUTH_SECRET as a server-side environment variable
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  // Log environment variables during build for debugging
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log('\n======= BUILD ENVIRONMENT INFO =======');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
      console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
      console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
      console.log('======================================\n');
    }
    return config;
  },
}

module.exports = nextConfig 