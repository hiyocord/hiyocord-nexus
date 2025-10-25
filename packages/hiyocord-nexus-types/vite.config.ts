import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'hiyocord-nexus-types',
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
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
      outDir: "dist",
      exclude: ["node_modules"],
      insertTypesEntry: true,
    }),
  ],
})
