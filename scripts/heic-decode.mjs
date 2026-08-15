/**
 * HEIC → JPEG for provision (GHA sharp lacks HEVC / 11.6003).
 */
import convertHeic from 'heic-convert';
import { detectImageFormat } from './safe-media.mjs';

/** Prebuilt sharp/libvips on GHA cannot decode HEVC HEIC (`11.6003`). */
export function isHeicDecodeError(err) {
  const msg = String(err?.message || err || '');
  return /heif|heic|11\.6003|compression format has not been built/i.test(msg);
}

export async function heicToJpegBuffer(buffer) {
  try {
    const out = await convertHeic({
      buffer,
      format: 'JPEG',
      quality: 0.92,
    });
    return Buffer.from(out);
  } catch (err) {
    throw new Error(`HEIC decode failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ensure buffer is something sharp can decode (JPEG/PNG/WebP).
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
export async function prepareImageBufferForSharp(buffer) {
  const magic = detectImageFormat(buffer);
  if (magic === 'heic') {
    return heicToJpegBuffer(buffer);
  }
  return buffer;
}
