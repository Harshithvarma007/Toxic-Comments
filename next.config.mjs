/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js the app lives at /toxic
  basePath: "/toxic",
  
  // This creates a static HTML/CSS/JS build (easier to deploy)
  output: "export",
  
  // Required for static exports if you use next/image (we aren't, but good safety)
  images: {
    unoptimized: true,
  },
  
  // Ensures strict React standards
  reactStrictMode: true,
};

export default nextConfig;