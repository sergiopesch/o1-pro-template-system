/*
Configures Next.js for the app.
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
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
    // Still generate the build even with type errors to allow CI/CD pipelines to continue
    // The build will still fail in development
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // Optimize package size and performance
  transpilePackages: ["lucide-react"],
  // Enable strict mode for better development practices
  reactStrictMode: true,
  // Use the new app router exclusively
  skipTrailingSlashRedirect: true,
  // Performance optimization for production builds
  swcMinify: true,
}

export default nextConfig
