import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone: the Docker image ships only the traced server, not node_modules.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
