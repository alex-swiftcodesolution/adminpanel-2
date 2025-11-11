import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "euimagesd2h2yqnfpu4gl5.cdn5th.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
