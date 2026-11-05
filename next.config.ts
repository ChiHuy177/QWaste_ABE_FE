import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingRoot: __dirname,
    allowedDevOrigins: ['192.168.157.1'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.pravatar.cc',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'source.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
        ],
    },
    transpilePackages: [
        'antd',
        '@ant-design/icons',
        '@ant-design/cssinjs',
        '@ant-design/nextjs-registry',
    ],
    experimental: {
        optimizePackageImports: ['antd', '@ant-design/icons'],
        webpackMemoryOptimizations: true,
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // Turbopack is the default bundler (dev --turbopack, and build as of
    // Next 16); this empty block just acknowledges that on purpose so Next
    // doesn't flag the webpack() config below as a possible mistake. The
    // webpack() hook still applies if the app is ever built with --webpack.
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
            };
        }
        return config;
    },
};

export default nextConfig;
