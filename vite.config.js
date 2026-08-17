import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        // Fast, no external dependencies. Safe to run on every save.
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.js'],
          include: ['src/**/*.test.{js,jsx}'],
          // lib/supabase.js calls createClient at module scope, which throws
          // if these are missing. .env is gitignored, so CI has none — tests
          // must not depend on a developer's local file. Placeholders only:
          // every test that touches the network mocks the lib module.
          env: {
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'unit-test-placeholder-key',
          },
        },
      },
      {
        // Hits the local Supabase stack, so it needs `npx supabase start`.
        // Skips with a clear message when the stack is not running.
        extends: true,
        test: {
          name: 'integration',
          globals: true,
          environment: 'node',
          include: ['tests/integration/**/*.test.js'],
          testTimeout: 20000,
          hookTimeout: 30000,
          // These share one database, so they must not run in parallel.
          fileParallelism: false,
        },
      },
    ],
  },
})
