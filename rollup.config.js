import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import filesize from 'rollup-plugin-filesize';
import { visualizer } from 'rollup-plugin-visualizer';
import brotli from 'rollup-plugin-brotli'; // ✨ NEW

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const isProd = process.env.NODE_ENV === 'production';

const basePlugins = [
  nodeResolve({ browser: true, extensions: ['.ts', '.js'] }),
  commonjs(),
  typescript({ tsconfig: './tsconfig.json', declaration: true }),
  filesize(),
  visualizer({
    filename: 'dist/stats.html',
    title: 'XJX Bundle Visualizer',
    gzipSize: true,
    brotliSize: true,
    open: false
  })
];

export default [
  // Core bundle (no extensions)
  {
    input: 'src/index.ts',
    external: [...Object.keys(packageJson.peerDependencies || {})],
    output: [
      { file: 'dist/index.js', format: 'esm', sourcemap: !isProd, exports: 'named' },
      { file: 'dist/xjx.umd.js', format: 'umd', name: 'XJX', sourcemap: !isProd, exports: 'named', globals: { jsdom: 'JSDOM', '@xmldom/xmldom': 'xmldom' } },
      { file: 'dist/xjx.min.js', format: 'iife', name: 'XJX', sourcemap: !isProd, exports: 'named', plugins: [terser()] }
    ],
    plugins: [
      ...basePlugins,
      isProd && brotli({ // ✨ Only compress in production
        extensions: ['js'],
        additional: ['dist/index.js', 'dist/xjx.umd.js', 'dist/xjx.min.js']
      })
    ].filter(Boolean)
  },

  // "Full" bundle (core + extensions)
  {
    input: 'src/extensions.ts',
    external: [...Object.keys(packageJson.peerDependencies || {})],
    output: [
      { file: 'dist/xjx.full.js', format: 'esm', sourcemap: !isProd, exports: 'named' }
    ],
    plugins: [
      ...basePlugins,
      isProd && brotli({
        extensions: ['js'],
        additional: ['dist/xjx.full.js']
      })
    ].filter(Boolean)
  },

  // Types
  {
    input: 'dist/dts/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()]
  }
];