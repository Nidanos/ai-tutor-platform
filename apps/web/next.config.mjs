/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ai-tutor/types ships raw .ts source, so Next must compile it.
  transpilePackages: ["@ai-tutor/types"],
};

export default nextConfig;
