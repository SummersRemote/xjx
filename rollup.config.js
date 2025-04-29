import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import filesize from 'rollup-plugin-filesize';
import { visualizer } from 'rollup-plugin-visualizer';
import brotli from 'rollup-plugin-brotli';

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

const compressionPlugin = isProd && brotli({
  extensions: ['js'],
});

export default [
  // Core bundle
  {
    input: 'src/index.ts',
    external: [...Object.keys(packageJson.peerDependencies || {})],
    output: [
      { 
        file: 'dist/index.js', 
        format: 'esm', 
        sourcemap: !isProd, 
        exports: 'named' 
      },
      { 
        file: 'dist/xjx.umd.js', 
        format: 'umd', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        globals: { jsdom: 'JSDOM', '@xmldom/xmldom': 'xmldom' } 
      },
      { 
        file: 'dist/xjx.min.js', 
        format: 'iife', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        plugins: [terser()] 
      }
    ],
    plugins: [
      ...basePlugins,
      compressionPlugin
    ].filter(Boolean)
  },

  // Full bundle (core + extensions)
  {
    input: 'src/xjx.full.ts',
    external: [...Object.keys(packageJson.peerDependencies || {})],
    output: [
      { 
        file: 'dist/xjx.full.js', 
        format: 'esm', 
        sourcemap: !isProd, 
        exports: 'named' 
      },
      { 
        file: 'dist/xjx.full.umd.js', 
        format: 'umd', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        globals: { jsdom: 'JSDOM', '@xmldom/xmldom': 'xmldom' } 
      },
      { 
        file: 'dist/xjx.full.min.js', 
        format: 'iife', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        plugins: [terser()] 
      }
    ],
    plugins: [
      ...basePlugins,
      compressionPlugin
    ].filter(Boolean)
  },

  // Individual extensions
  {
    input: 'src/extensions/GetPathExtension.ts',
    external: ['../core/utils/json-utils', '../core/XJX'],
    output: [
      { 
        file: 'dist/extensions/GetPathExtension.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      compressionPlugin
    ].filter(Boolean)
  },

  {
    input: 'src/extensions/GetJsonSchemaExtension.ts',
    external: ['../core/utils/json-utils', '../core/XJX'],
    output: [
      { 
        file: 'dist/extensions/GetJsonSchemaExtension.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      compressionPlugin
    ].filter(Boolean)
  },

  // Types bundle
  {
    input: 'dist/dts/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  // Extension types
  {
    input: 'dist/dts/extensions/GetPathExtension.d.ts',
    output: { file: 'dist/extensions/GetPathExtension.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/extensions/GetJsonSchemaExtension.d.ts',
    output: { file: 'dist/extensions/GetJsonSchemaExtension.d.ts', format: 'es' },
    plugins: [dts()]
  }
];