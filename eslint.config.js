import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ignoreRestSiblings: `const { id, ...rest } = obj` is the idiom for
      // omitting a key, so the named siblings are used, not unused.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    // Integration tests and the helper scripts run in Node, not a browser:
    // they read process.env and shell out. Without this they fail no-undef.
    files: ['tests/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
