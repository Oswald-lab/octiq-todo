import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      target: './src/api',
      client: 'react-query',
      mode: 'tags',
      schemas: './src/api/model',
      override: {
        mutator: {
          path: './src/lib/custom-fetcher.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
