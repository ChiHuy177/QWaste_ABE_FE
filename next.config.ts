import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    outputFileTracingRoot: __dirname,
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
