// Reads wasm_exec.js and generates a TypeScript module that exports its
// content as a string constant. This allows the library to bundle the Go
// WebAssembly runtime without requiring a separate file at runtime.

import { readFileSync, writeFileSync } from 'node:fs';

const content = readFileSync('wasm_exec.js', 'utf-8');
const output = `// Auto-generated from wasm_exec.js — do not edit.\n// Regenerate with: npm run generate:wasm-exec\nexport const wasmExecJs = ${JSON.stringify(content)};\n`;
writeFileSync('src/wasm_exec_inline.ts', output);
