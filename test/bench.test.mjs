import {describe, it} from 'node:test';
import {readFileSync} from 'node:fs';

// Use a single test vector for the verification benchmarks.
const bip322 = JSON.parse(
    readFileSync(new URL('test-vectors/basic-test-vectors.json', import.meta.url), 'utf-8'),
);
const vec = bip322.simple[0];
const sig = vec.bip322_signatures[0];

describe('benchmark', () => {
    // This must run first — it's the only call that hits the cold path
    // (WASM load + Go boot + verification in one shot).
    it('cold verifyMessage() without explicit init()', async () => {
        const {verifyMessage} = await import('../dist/index.js');

        const start = performance.now();
        const result = await verifyMessage(
            vec.message,
            vec.address,
            sig,
            'mainnet',
        );
        const elapsed = performance.now() - start;

        console.log(`  cold verifyMessage(): ${elapsed.toFixed(1)} ms  (includes WASM init)`);

        if (!result.valid) {
            throw new Error(`verification failed: ${result.error}`);
        }
    });

    // Runs second — init is already cached in the module-level initPromise,
    // so this measures pure verification time only.
    it('warm verifyMessage() after init is cached', async () => {
        const {verifyMessage} = await import('../dist/index.js');

        const start = performance.now();
        const result = await verifyMessage(
            vec.message,
            vec.address,
            sig,
            'mainnet',
        );
        const elapsed = performance.now() - start;

        console.log(`  warm verifyMessage(): ${elapsed.toFixed(1)} ms  (init already cached)`);

        if (!result.valid) {
            throw new Error(`verification failed: ${result.error}`);
        }
    });
});
