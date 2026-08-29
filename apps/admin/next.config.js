/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/firebase"],
  // firebase-admin is a server-only package; prevent Next.js from trying to bundle it for the client
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
