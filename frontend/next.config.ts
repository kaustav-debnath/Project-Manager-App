import type { NextConfig } from "next";

// Static export is only needed for the production build (Docker image).
// The dev server needs rewrites so /api/* proxies to the FastAPI backend.
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" as const }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxy API requests to backend during development
  async rewrites() {
    if (isDev) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
