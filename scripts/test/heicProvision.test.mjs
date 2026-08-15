/**
 * Unit smoke: HEIC magic detection + sharp heif error classifier.
 * Full HEIC decode is covered in Provision GHA (real iPhone assets).
 */
import assert from 'node:assert/strict';
import { detectImageFormat } from '../safe-media.mjs';
import { isHeicDecodeError } from '../heic-decode.mjs';

function fakeHeicBuffer() {
  const buf = Buffer.alloc(32, 0);
  buf.writeUInt32BE(32, 0);
  buf.write('ftyp', 4, 'ascii');
  buf.write('heic', 8, 'ascii');
  return buf;
}

assert.equal(detectImageFormat(fakeHeicBuffer()), 'heic');
assert.equal(detectImageFormat(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(12)])), 'jpeg');

assert.equal(
  isHeicDecodeError(new Error('heif: Support for this compression format has not been built in (11.6003)')),
  true,
);
assert.equal(isHeicDecodeError(new Error('Input buffer has corrupt header')), false);

console.log('heicProvision.test.mjs: ok');
