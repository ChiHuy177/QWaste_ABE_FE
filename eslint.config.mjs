import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import queryPlugin from '@tanstack/eslint-plugin-query';

export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'node_modules/**',
      '*.config.*',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...queryPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], // Ignore variables starting with _
      'prefer-const': 'warn',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-useless-escape': 'off',
      'no-constant-binary-expression': 'off',
      'no-var': 'warn',
      'no-empty': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
];
