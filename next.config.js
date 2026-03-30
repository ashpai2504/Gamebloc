/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "crests.football-data.org",
        pathname: "/**",
      },
    ],
  },
  // Keep optional native ws deps external in server builds (works with Turbopack).
  serverExternalPackages: ["utf-8-validate", "bufferutil"],
};

module.exports = nextConfig;
