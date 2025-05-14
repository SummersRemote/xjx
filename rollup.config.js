import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "fs";
import filesize from "rollup-plugin-filesize";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const isProd = process.env.NODE_ENV === "production";

// External dependencies that shouldn't be bundled
const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.dependencies || {}),
];

// Base plugins for all builds
const basePlugins = [
  nodeResolve({
    browser: true,
    extensions: [".ts", ".js"],
    preferBuiltins: false,
  }),
  commonjs(),
  filesize(),
];

// Production minification plugin
const prodPlugins = isProd ? [terser()] : [];

export default [
  // Main ESM bundle (tree-shakable)
  {
    input: "src/index.ts",
    external,
    output: {
      dir: "dist/esm",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: !isProd,
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, 
        declarationDir: undefined, 
      }),
    ],
  },

  // Full bundle with all features
  {
    input: "src/xjx.full.ts",
    external,
    output: {
      dir: "dist/esm",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: !isProd,
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, 
        declarationDir: undefined, 
      }),
    ],
  },

  // UMD bundle for browsers and CommonJS
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/umd/xjx.js",
      format: "umd",
      name: "XJX",
      sourcemap: !isProd,
      globals: {
        jsdom: "JSDOM",
        "@xmldom/xmldom": "xmldom",
      },
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist/umd",
        declaration: false,
      }),
      ...prodPlugins,
    ],
  },

  // Minified UMD bundle
  {
    input: "src/index.ts",
    external,
    output: {
      file: "dist/umd/xjx.min.js",
      format: "umd",
      name: "XJX",
      sourcemap: !isProd,
      globals: {
        jsdom: "JSDOM",
        "@xmldom/xmldom": "xmldom",
      },
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist/umd",
        declaration: false,
      }),
      terser(),
    ],
  },

  // Full bundle with all features
  {
    input: "src/xjx.full.ts",
    external,
    output: {
      file: "dist/umd/xjx.full.js",
      format: "umd",
      name: "XJX",
      sourcemap: !isProd,
      globals: {
        jsdom: "JSDOM",
        "@xmldom/xmldom": "xmldom",
      },
    },
    plugins: [
      ...basePlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist/umd",
        declaration: false,
      }),
      ...prodPlugins,
    ],
  },
];
