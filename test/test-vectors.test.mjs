import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMessage} from '../dist/index.js';

const bip322 = JSON.parse(readFileSync(
  new URL('test-vectors/basic-test-vectors.json', import.meta.url), 'utf-8'
));
const bip322Generated = JSON.parse(readFileSync(
  new URL('test-vectors/generated-test-vectors.json', import.meta.url), 'utf-8',
));

function runSuite(name, vectors) {
  describe(name, () => {
    for (const vec of vectors) {
      for (const sig of vec.bip322_signatures) {
        const label = `${vec.type} | ${vec.address.slice(0, 16)}… | ` +
          `"${vec.message.slice(0, 30)}"`;
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

          const negativeResult = await verifyMessage(
            vec.message + 'x',
            vec.address,
            sig,
            'mainnet',
          );
          assert.match(
            negativeResult.error, /invalid signature/,
            `unexpected error: ${result.error}`,
          );
          assert.equal(
            negativeResult.valid, false, 'expected valid=false'
          );
        });
      }
    }
  });
}

function runErrorSuite(name, vectors) {
  describe(name, () => {
    for (const vec of vectors) {
      it(vec.description, async () => {
        const result = await verifyMessage(
          vec.message,
          vec.address,
          vec.signature,
          'mainnet',
        );
        assert.equal(result.valid, false, 'expected valid=false');
        assert.ok(
          result.error.includes(vec.error_substr),
          `expected error containing "${vec.error_substr}", got: ${result.error}`,
        );
      });
    }
  });
}

runSuite('basic-test-vectors.json simple', bip322.simple);
runErrorSuite('basic-test-vectors.json error', bip322.error);
runSuite('generated-test-vectors.json simple', bip322Generated.simple);
runSuite('generated-test-vectors.json full', bip322Generated.full);
runErrorSuite('generated-test-vectors.json error', bip322Generated.error);
