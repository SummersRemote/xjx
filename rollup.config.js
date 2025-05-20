// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";
import { readFileSync } from "fs";

// Read package.json for external dependencies
const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const isProd = process.env.NODE_ENV === "production";

// Don't bundle dependencies
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

// Common plugins for all builds
const commonPlugins = [
  nodeResolve({
    browser: true,
    extensions: [".ts", ".js"],
  }),
  commonjs(),
  filesize(),
];

// Production-only plugins for minification
const prodPlugins = isProd ? [terser()] : [];

// Define configs
export default [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/esm",
      format: "es",
      sourcemap: !isProd,
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "named" // Fix for mixed exports warning
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // Skip declarations in this build
        outDir: "dist/esm",
        rootDir: "src",
      }),
    ],
    // IMPORTANT: Preserve all side effects to ensure extension registration works
    treeshake: {
      moduleSideEffects: "no-external", // Preserve all side effects in internal modules
      preset: "recommended"
    },
  },
  
  // Additional export point for transforms folder
  {
    input: "src/transforms/index.ts",
    output: {
      dir: "dist/esm",
      format: "es", 
      sourcemap: !isProd,
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "named"
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        outDir: "dist/esm",
        rootDir: "src",
      }),
    ],
    treeshake: false, // Don't treeshake transforms to ensure all classes are included
  },
  
  // CommonJS build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/cjs",
      format: "cjs",
      sourcemap: !isProd,
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "named" // Fix for mixed exports warning
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // Skip declarations in this build
        outDir: "dist/cjs",
        rootDir: "src",
      }),
    ],
    // IMPORTANT: Preserve all side effects to ensure extension registration works
    treeshake: {
      moduleSideEffects: "no-external", // Preserve all side effects in internal modules
      preset: "recommended"
    },
  },
  
  // UMD build (browser-friendly)
  {
    input: "src/index.ts",
    output: {
      file: "dist/umd/xjx.js",
      format: "umd",
      name: "XJX",
      sourcemap: !isProd,
      exports: "named", // Fix for mixed exports warning
      globals: {
        jsdom: "JSDOM",
        "@xmldom/xmldom": "xmldom",
      },
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // Skip declarations in this build
        declarationMap: false, // Turn off declaration maps to match
        composite: false, // Make sure composite is off
      }),
      ...prodPlugins,
    ],
    // UMD build should preserve everything
    treeshake: false,
  },
  
  // Minified UMD build
  isProd && {
    input: "src/index.ts",
    output: {
      file: "dist/umd/xjx.min.js",
      format: "umd",
      name: "XJX",
      sourcemap: false,
      exports: "named", // Fix for mixed exports warning
      globals: {
        jsdom: "JSDOM",
        "@xmldom/xmldom": "xmldom",
      },
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // Skip declarations in this build
        declarationMap: false, // Turn off declaration maps to match
        composite: false, // Make sure composite is off
      }),
      terser(),
    ],
    // UMD build should preserve everything
    treeshake: false,
  },
  
  // Full bundle (all dependencies)
  {
    input: "src/xjx.full.ts",
    output: {
      file: "dist/umd/xjx.full.js",
      format: "umd",
      name: "XJX",
      sourcemap: !isProd,
      exports: "named", // Fix for mixed exports warning
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // Skip declarations in this build
      }),
      ...prodPlugins,
    ],
  },
  
  // Declaration files build (separate)
  {
    input: "src/index.ts",
    output: {
      dir: "dist/types",
      format: "es", // Format doesn't matter for declarations
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true, // Generate declarations
        declarationMap: true, // Generate declaration maps
        emitDeclarationOnly: true, // Only output declarations
        rootDir: "src",
      }),
    ],
  },
].filter(Boolean);