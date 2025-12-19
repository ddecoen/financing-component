/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore canvas module on both client and server since we don't use it
    config.resolve.alias.canvas = false;
    
    // Also ignore other optional pdfjs-dist dependencies
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] = false;
    
    return config;
  },
}

module.exports = nextConfig
