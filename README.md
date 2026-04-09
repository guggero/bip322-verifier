# bip322-verifier

A JavaScript/TypeScript library for verifying
[BIP-322](https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki)
Bitcoin signed messages. The cryptographic verification runs in a Go-compiled
WebAssembly module and works in both Node.js and browsers.

Supports **P2WPKH**, **P2SH-P2WPKH**, **P2TR** (Taproot), and **multisig**
address types.

## Prerequisites

- **Go >= 1.25.0** - Install from <https://go.dev/dl/>
- **Node.js >= 18** - Install from <https://nodejs.org/>

## Building

Install npm dependencies, then build the WASM module and JS wrapper:

```bash
npm install
npm run build
```

This runs two steps under the hood:

1. **`npm run build:wasm`** - Compiles `main.go` to `bip322.wasm` using
   `GOOS=js GOARCH=wasm`.
2. **`npm run build:js`** - Inlines the Go WASM runtime, bundles the
   TypeScript source with [tsup](https://github.com/egoist/tsup), and copies
   `bip322.wasm` into `dist/`.

## Usage

### Node.js / TypeScript

```bash
npm install bip322-verifier
```

```typescript
import { verifyMessage } from 'bip322-verifier';

const result = await verifyMessage(
  'Hello World',                                    // message
  'bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l',   // address
  'AkcwRAIgZRfIY3p7/DoVTty6YZbWS71bc5Vct9p9Fia83eRmw2QCICK' +
  '/ENGfwLtptFluMGs2KsqoNSk89pO7F29zJLUx9a/sASECx/EgAxlkQp' +
  'Q9hYjgGu6EBCPMVPwVIVJqO4XCsMvViHI=',            // signature (base64)
  'mainnet',                                         // network (optional)
);

console.log(result.valid); // true
console.log(result.error); // undefined when valid
```

### Browser

Serve `example.html`, `wasm_exec.js`, and `bip322.wasm` from the same
directory with any HTTP server:

```bash
npm run build:wasm
python3 -m http.server 8080
# open http://localhost:8080/example.html
```

### Custom WASM loading

You can pre-initialize the WASM module with a custom source by calling `init`
before `verifyMessage`:

```typescript
import { init, verifyMessage } from 'bip322-verifier';

// From a URL
await init('/assets/bip322.wasm');

// From an ArrayBuffer
const buf = await fetch('/assets/bip322.wasm').then(r => r.arrayBuffer());
await init(buf);

// From a fetch Response (uses streaming compilation)
await init(fetch('/assets/bip322.wasm'));
```

## API

### `verifyMessage(message, address, signature, network?)`

Verify a BIP-322 signed message.

| Parameter   | Type     | Description                                                                                       |
|-------------|----------|---------------------------------------------------------------------------------------------------|
| `message`   | `string` | The message that was signed.                                                                      |
| `address`   | `string` | The Bitcoin address to verify against.                                                            |
| `signature` | `string` | The base64-encoded BIP-322 signature.                                                             |
| `network`   | `string` | Optional. `"mainnet"` (default), `"testnet3"`, `"testnet4"`, `"signet"`, `"regtest"`, or `"simnet"`. |

Returns `Promise<{ valid: boolean; error?: string }>`.

### `init(wasmSource?)`

Explicitly initialize the WASM module. Called automatically on the first
`verifyMessage()` call. Accepts an optional `ArrayBuffer`, `Response`, or URL
string.

## Testing

Tests run against the BIP-322 test vectors:

```bash
npm run build
npm test
```

## License

MIT
