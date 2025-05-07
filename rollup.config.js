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

// External dependencies that shouldn't be bundled
const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.dependencies || {})
];

// Common plugins for all bundles
const basePlugins = [
  nodeResolve({ 
    browser: true, 
    extensions: ['.ts', '.js'],
    preferBuiltins: false 
  }),
  commonjs(),
  typescript({ 
    tsconfig: './tsconfig.json', 
    declaration: true,
    sourceMap: !isProd
  }),
  filesize(),
  visualizer({
    filename: 'dist/stats.html',
    title: 'XJX Bundle Visualizer',
    gzipSize: true,
    brotliSize: true,
    open: false
  })
];

// Add compression for production builds
const prodPlugins = isProd ? [
  brotli({
    extensions: ['js'],
  })
] : [];

export default [
  // Core bundle - minimal version with just essential functionality
  {
    input: 'src/index.ts',
    external,
    output: [
      // ESM bundle for modern environments
      { 
        file: 'dist/index.js', 
        format: 'esm', 
        sourcemap: !isProd, 
        exports: 'named' 
      },
      // UMD bundle for browser/CommonJS compatibility
      { 
        file: 'dist/xjx.umd.js', 
        format: 'umd', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        globals: { 
          jsdom: 'JSDOM', 
          '@xmldom/xmldom': 'xmldom' 
        } 
      },
      // Minified IIFE bundle for direct browser usage
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
      ...prodPlugins
    ]
  },

  // Full bundle - includes all extensions and utilities
  {
    input: 'src/xjx.full.ts',
    external,
    output: [
      // ESM bundle
      { 
        file: 'dist/xjx.full.js', 
        format: 'esm', 
        sourcemap: !isProd, 
        exports: 'named' 
      },
      // UMD bundle
      { 
        file: 'dist/xjx.full.umd.js', 
        format: 'umd', 
        name: 'XJX', 
        sourcemap: !isProd, 
        exports: 'named', 
        globals: { 
          jsdom: 'JSDOM', 
          '@xmldom/xmldom': 'xmldom' 
        } 
      },
      // Minified IIFE bundle
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
      ...prodPlugins
    ]
  },

  // Submodules for specific functionality
  
  // Converters bundle
  {
    input: 'src/core/converters/index.ts',
    external: [...external, '../types/transform-interfaces', '../utils/xml-utils'],
    output: [
      { 
        file: 'dist/converters.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      ...prodPlugins
    ]
  },

  // Transforms bundle
  {
    input: 'src/core/transforms/index.ts',
    external: [...external, '../types/transform-interfaces'],
    output: [
      { 
        file: 'dist/transforms.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      ...prodPlugins
    ]
  },

  // Utils bundle
  {
    input: 'src/core/utils/index.ts',
    external: [...external, '../types/transform-interfaces', '../types/error-types'],
    output: [
      { 
        file: 'dist/utils.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      ...prodPlugins
    ]
  },

  // Individual extensions

  // GetPath Extension
  {
    input: 'src/core/commands/terminal/GetPathExtension.ts',
    external: [...external, '../../XJX', '../../types/extension-types'],
    output: [
      { 
        file: 'dist/extensions/GetPathExtension.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      ...prodPlugins
    ]
  },

  // GetJsonSchema Extension
  {
    input: 'src/core/commands/terminal/GetJsonSchemaExtension.ts',
    external: [...external, '../../XJX', '../../types/extension-types', '../../types/json-types'],
    output: [
      { 
        file: 'dist/extensions/GetJsonSchemaExtension.js', 
        format: 'esm', 
        sourcemap: !isProd 
      }
    ],
    plugins: [
      ...basePlugins,
      ...prodPlugins
    ]
  },

  // Types bundles - consolidate types into unified declaration files
  {
    input: 'dist/dts/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/core/converters/index.d.ts',
    output: { file: 'dist/converters.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/core/transforms/index.d.ts',
    output: { file: 'dist/transforms.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/core/utils/index.d.ts',
    output: { file: 'dist/utils.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/core/commands/terminal/GetPathExtension.d.ts',
    output: { file: 'dist/extensions/GetPathExtension.d.ts', format: 'es' },
    plugins: [dts()]
  },
  
  {
    input: 'dist/dts/core/commands/terminal/GetJsonSchemaExtension.d.ts',
    output: { file: 'dist/extensions/GetJsonSchemaExtension.d.ts', format: 'es' },
    plugins: [dts()]
  }
];