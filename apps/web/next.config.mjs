/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ai-tutor/types ships raw .ts source, so Next must compile it.
  transpilePackages: ["@ai-tutor/types"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
