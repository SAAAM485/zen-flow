import { defineConfig } from 'prisma/define';

export default defineConfig({
  seed: {
    run: 'node --loader ts-node/esm prisma/seed.ts',
  },
});
