/** @type {import('next').NextConfig} */

// Nom du repo GitHub Pages (URL = https://<user>.github.io/App-graille/).
const repo = "App-graille";
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  env: {
    // exposé au client pour construire des liens de partage absolus
    NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : "",
  },
  ...(isPages
    ? {
        output: "export",
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

module.exports = nextConfig;
