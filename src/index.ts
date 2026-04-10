import { wasmExecJs } from './wasm_exec_inline';

let initPromise: Promise<void> | null = null;

/**
 * Result of a BIP-322 signature verification.
 */
export interface VerifyResult {
  valid: boolean;
  error?: string;
}

function ensureGoRuntime(): void {
  if ((globalThis as any).Go) return;
  new Function(wasmExecJs)();
}

async function loadWasm(
  wasmSource?: ArrayBuffer | Response | string,
): Promise<void> {
  ensureGoRuntime();

  const go = new (globalThis as any).Go();

  const readyPromise = new Promise<void>((resolve) => {
    (globalThis as any).onBip322Ready = () => {
      delete (globalThis as any).onBip322Ready;
      resolve();
    };
  });

  let result: WebAssembly.WebAssemblyInstantiatedSource;

  if (wasmSource instanceof ArrayBuffer) {
    result = await WebAssembly.instantiate(wasmSource, go.importObject);
  } else if (typeof wasmSource === 'string') {
    result = await WebAssembly.instantiateStreaming(
      fetch(wasmSource),
      go.importObject,
    );
  } else if (wasmSource instanceof Response) {
    result = await WebAssembly.instantiateStreaming(
      wasmSource,
      go.importObject,
    );
  } else {
    // Auto-detect environment and load WASM from alongside this module.
    if (typeof process !== 'undefined' && process.versions?.node) {
      // Node.js: read from filesystem relative to this file.
      // Use new Function to prevent bundlers from statically analyzing
      // these Node.js-only imports and erroring in browser builds.
      const nodeImport = new Function('m', 'return import(m)') as (
        m: string,
      ) => Promise<any>;
      const { readFile } = await nodeImport('node:fs/promises');
      const { fileURLToPath } = await nodeImport('node:url');
      const { dirname, join } = await nodeImport('node:path');
      const dir = dirname(fileURLToPath(import.meta.url));
      const buf = await readFile(join(dir, 'bip322.wasm'));
      result = await WebAssembly.instantiate(buf, go.importObject);
    } else {
      // Browser: fetch relative to this module's URL.
      const url = new URL('bip322.wasm', import.meta.url);
      result = await WebAssembly.instantiateStreaming(
        fetch(url.href),
        go.importObject,
      );
    }
  }

  go.run(result.instance);
  await readyPromise;
}

/**
 * Initialize the WASM module. Called automatically on first verifyMessage()
 * call. You can call this explicitly to pre-load the WASM module or to
 * provide a custom WASM source.
 *
 * @param wasmSource - Optional WASM source: a URL string, ArrayBuffer with
 *   the WASM bytes, or a fetch Response. If omitted, the module auto-detects
 *   the environment and loads bip322.wasm from alongside this file.
 */
export async function init(
  wasmSource?: ArrayBuffer | Response | string,
): Promise<void> {
  if (!initPromise) {
    initPromise = loadWasm(wasmSource).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

/**
 * Verify a BIP-322 signed message.
 *
 * @param message   - The message that was signed.
 * @param address   - The Bitcoin address to verify against.
 * @param signature - The base64-encoded BIP-322 signature.
 * @param network   - The Bitcoin network: "mainnet" (default), "testnet",
 *   "testnet3", "testnet4", "signet", "regtest", or "simnet".
 * @returns An object with `valid` (boolean) and optionally `error` (string).
 */
export async function verifyMessage(
  message: string,
  address: string,
  signature: string,
  network: string = 'mainnet',
): Promise<VerifyResult> {
  await init();
  return (globalThis as any).bip322.verifyMessage(
    message,
    address,
    signature,
    network,
  );
}
