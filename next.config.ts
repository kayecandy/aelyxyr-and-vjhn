import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Room for the 5MB proof-of-payment upload plus form fields.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
