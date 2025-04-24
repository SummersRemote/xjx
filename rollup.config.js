import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

import filesize from 'rollup-plugin-filesize';
import { visualizer } from 'rollup-plugin-visualizer';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  external: [...Object.keys(packageJson.peerDependencies || {})],
  plugins: [
    nodeResolve({
      browser: true,
      extensions: ['.ts', '.js']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true
    }),
    visualizer({
      filename: 'dist/stats.html',
      title: 'XJX Bundle Visualizer',
      gzipSize: true,
      brotliSize: true,
      open: false // set to true to auto-open the report in browser
    }),
    filesize()
  ]
};

export default [
  // ESM build
  {
    ...baseConfig,
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: !isProd,
      exports: 'named'
    }
  },
  // UMD build (browser-compatible)
  {
    ...baseConfig,
    output: {
      file: 'dist/xjx.umd.js',
      format: 'umd',
      name: 'XJX',
      sourcemap: !isProd,
      exports: 'named',
      globals: {
        // Define global variable names for external dependencies if any
        'jsdom': 'JSDOM',
        '@xmldom/xmldom': 'xmldom'
      }
    },
    plugins: [
      ...baseConfig.plugins,
      isProd && terser()
    ].filter(Boolean)
  },
  // Browser-specific IIFE build
  {
    ...baseConfig,
    output: {
      file: 'dist/xjx.min.js',
      format: 'iife',
      name: 'XJX',
      sourcemap: !isProd,
      exports: 'named'
    },
    plugins: [
      ...baseConfig.plugins,
      terser()
    ]
  },
  // Type definitions
  {
    input: 'dist/dts/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];