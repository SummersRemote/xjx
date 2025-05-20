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
    // Preserve all side effects to ensure extension registration works
    treeshake: {
      moduleSideEffects: "no-external",
      preset: "recommended"
    },
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
      exports: "named"
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        outDir: "dist/cjs",
        rootDir: "src",
      }),
    ],
    treeshake: {
      moduleSideEffects: "no-external",
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
      exports: "named",
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
        declaration: false,
        declarationMap: false,
        composite: false,
      }),
      ...prodPlugins,
    ],
    treeshake: false, // Preserve everything for UMD
  },
  
  // Minified UMD build
  isProd && {
    input: "src/index.ts",
    output: {
      file: "dist/umd/xjx.min.js",
      format: "umd",
      name: "XJX",
      sourcemap: false,
      exports: "named",
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
        declaration: false,
        declarationMap: false,
        composite: false,
      }),
      terser(),
    ],
    treeshake: false, // Preserve everything for UMD
  },
  
  // Declaration files build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/types",
      format: "es",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: true  // Add this to fix the first error
    },
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        outDir: "dist/types",  // Ensure this matches the output.dir value above
        rootDir: "src",
      }),
    ]
  },
].filter(Boolean);