import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['js/app.js', '.netlify/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
