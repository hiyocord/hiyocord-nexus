import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'hiyocord-nexus-core',
      fileName: "index"
    },
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: {
        dir: 'dist',
        format: 'es',
      },
    }
  },
  plugins: [
    tsconfigPaths(),
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.node.json')}),
  ],
})
