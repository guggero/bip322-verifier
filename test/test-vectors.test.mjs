import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyMessage } from '../dist/index.js';

const bip322 = JSON.parse(
  readFileSync(new URL('test-vectors/bip322.json', import.meta.url), 'utf-8'),
);
const bip322Generated = JSON.parse(
  readFileSync(
    new URL('test-vectors/bip322-generated.json', import.meta.url),
    'utf-8',
  ),
);

function runSuite(name, vectors) {
  describe(name, () => {
    for (const vec of vectors) {
      for (const sig of vec.bip322_signatures) {
        const label = `${vec.type} | ${vec.address.slice(0, 16)}… | "${vec.message.slice(0, 30)}"`;
        it(label, async () => {
          const result = await verifyMessage(
            vec.message,
            vec.address,
            sig,
            'mainnet',
          );
          assert.equal(
            result.valid,
            true,
            `expected valid=true, got error: ${result.error}`,
          );
        });
      }
    }
  });
}

runSuite('bip322.json simple', bip322.simple);
runSuite('bip322-generated.json simple', bip322Generated.simple);
runSuite('bip322-generated.json full', bip322Generated.full);
