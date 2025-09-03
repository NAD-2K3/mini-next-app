// eslint.config.js
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,

  // Next.js rules
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Node.js environment (for require/module)
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  },

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-var-requires': 'off', // optional, since Next.js configs often need require()
    },
  },
];
