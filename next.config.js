const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    config.externals = config.externals || [];
    config.externals.push({ zipcodes: "commonjs zipcodes" });

    return config;
  },
};

module.exports = nextConfig;
