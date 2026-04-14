/*
Configures Next.js for the app.
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "*.supabase.co" },
      { hostname: "images.clerk.dev" },
      { hostname: "img.clerk.com" }
    ] 
  },
  // Enable TypeScript compiler
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize package size and performance
  transpilePackages: ["lucide-react"],
  // Enable strict mode for better development practices
  reactStrictMode: true,
  // Use the new app router exclusively
  skipTrailingSlashRedirect: true,
}

export default nextConfig
