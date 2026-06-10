import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: {
                    jsx: 'react-jsx',
                },
            },
        ],
    },

    testEnvironment: 'jsdom',

    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    testMatch: ['**/*.test.ts', '**/*.test.tsx'],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@app/(.*)$': '<rootDir>/src/app/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@configs/(.*)$': '<rootDir>/src/configs/$1',
        '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@libs/(.*)$': '<rootDir>/src/libs/$1',
        '^@locales/(.*)$': '<rootDir>/src/locales/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@stores/(.*)$': '<rootDir>/src/stores/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',

        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

        '\\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot)$': '<rootDir>/__mocks__/fileMock.js',
    },

    transformIgnorePatterns: ['node_modules/(?!(antd|@ant-design|rc-.*|@rc-component)/)'],
};

export default config;
