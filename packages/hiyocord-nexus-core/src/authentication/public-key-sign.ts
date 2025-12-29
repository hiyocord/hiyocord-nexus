/**
 * Public key signature for Nexus-ServiceWorker authentication
 * Replaces HMAC-based authentication with asymmetric cryptography
 */

import { getAlgorithm, type AlgorithmName } from './signature-algorithm';

/**
 * Concatenate multiple Uint8Arrays
 */
const concatBuffers = (buffers: Uint8Array[]) => {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
};

/**
 * Canonicalize headers for signature
 * - Convert keys to lowercase
 * - Sort alphabetically
 * - Exclude signature-related and cloudflare headers
 * - Format as "key:value\n"
 */
export const canonicalizeHeaders = (headers: Record<string, string>): string => {
  return Object.keys(headers)
    .map(key => ({ key: key.toLowerCase(), value: headers[key] }))
    .sort((a, b) => {
      if (a.key > b.key) return 1;
      if (a.key < b.key) return -1;
      return 0;
    })
    .filter(it => !['host', 'x-hiyocord-signature', 'x-hiyocord-algorithm', 'content-length'].includes(it.key))
    .filter(it => !it.key.startsWith('cf-'))
    .map(it => `${it.key}:${it.value}`)
    .join('\n');
};

/**
 * Create signing payload from headers and body
 */
export const createSigningPayload = (headers: Record<string, string>, body: ArrayBuffer): ArrayBuffer => {
  const encoder = new TextEncoder();
  const canonicalHeaders = canonicalizeHeaders(headers);
  const headerBytes = encoder.encode(canonicalHeaders);
  return concatBuffers([headerBytes, new Uint8Array(body)]).buffer;
};

/**
 * Sign request with private key
 * @param algorithm Algorithm name (e.g., "ed25519")
 * @param privateKey Base64-encoded private key
 * @param headers Request headers
 * @param body Request body
 * @returns Headers with signature and metadata
 */
export const signRequest = async (
  algorithm: AlgorithmName,
  privateKey: string,
  headers: Record<string, string>,
  body: ArrayBuffer | undefined
): Promise<Record<string, string>> => {
  const timestamp = Date.now().toString();
  const bodyBuffer = body ?? new ArrayBuffer(0);

  const headersWithTimestamp = {
    ...headers,
    'X-Hiyocord-Timestamp': timestamp,
    'X-Hiyocord-Algorithm': algorithm,
  };

  const payload = createSigningPayload(headersWithTimestamp, bodyBuffer);
  const algo = getAlgorithm(algorithm);
  const signature = await algo.sign(privateKey, payload);

  return {
    ...headersWithTimestamp,
    'X-Hiyocord-Signature': signature,
  };
};

/**
 * Verify request signature with public key
 * @param publicKey Base64-encoded public key
 * @param headers Request headers (must include X-Hiyocord-Signature, X-Hiyocord-Algorithm, X-Hiyocord-Timestamp)
 * @param body Request body
 * @returns true if signature is valid
 */
export const verifyRequest = async (
  publicKey: string,
  headers: Record<string, string>,
  body: ArrayBuffer
): Promise<boolean> => {
  const signature = headers['x-hiyocord-signature'] || headers['X-Hiyocord-Signature'];
  const algorithmName = headers['x-hiyocord-algorithm'] || headers['X-Hiyocord-Algorithm'];
  const timestamp = headers['x-hiyocord-timestamp'] || headers['X-Hiyocord-Timestamp'];

  if (!signature || !algorithmName || !timestamp) {
    return false;
  }

  // Verify timestamp (prevent replay attacks - 60 second window)
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 60_000) {
    return false;
  }

  try {
    const payload = createSigningPayload(headers, body);
    const algo = getAlgorithm(algorithmName as AlgorithmName);
    return await algo.verify(publicKey, signature, payload);
  } catch {
    return false;
  }
};
