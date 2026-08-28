import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        ast: 'ast/index.html',
        blockSpec: 'block-spec/index.html',
        diff: 'diff/index.html',
        fragment: 'fragment/index.html',
        materialize: 'materialize/index.html',
        turboWarpBlocks: 'turbowarp-blocks/index.html',
        sb3: 'sb3/index.html',
        vmBlocks: 'vm-blocks/index.html',
        scratchblocksCodec: 'scratchblocks-codec/index.html',
      },
    },
  },
});
