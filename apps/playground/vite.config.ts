import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        ast: 'ast/index.html',
        blockSpec: 'block-spec/index.html',
        turboWarpBlocks: 'turbowarp-blocks/index.html',
        sb3: 'sb3/index.html',
        scratchblocksCodec: 'scratchblocks-codec/index.html',
      },
    },
  },
});
