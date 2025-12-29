/**
 * Helper functions for service workers to sign requests to Nexus
 * Used when calling Discord API Proxy and other Nexus endpoints
 */

import { signRequest } from './public-key-sign';
import type { AlgorithmName } from './signature-algorithm';

/**
 * Create signed headers for a request to Nexus
 * Service workers should use this when calling Nexus APIs (e.g., Discord API Proxy)
 *
 * @param algorithm - Signature algorithm (e.g., "ed25519")
 * @param privateKey - Base64-encoded service worker private key
 * @param headers - Request headers
 * @param body - Request body
 * @returns Headers with signature
 */
export const signServiceWorkerRequest = async (
  algorithm: AlgorithmName,
  privateKey: string,
  headers: Record<string, string>,
  body: ArrayBuffer | undefined
): Promise<Record<string, string>> => {
  return await signRequest(algorithm, privateKey, headers, body);
};

/**
 * Create Authorization header for Discord API Proxy
 * Includes both JWT token and service worker signature
 *
 * @param algorithm - Signature algorithm
 * @param privateKey - Service worker private key
 * @param headers - Request headers
 * @param body - Request body
 * @returns Headers with Authorization and signature
 */
export const signDiscordApiProxyRequest = async (
  algorithm: AlgorithmName,
  privateKey: string,
  headers: Record<string, string>,
  body: ArrayBuffer | undefined
): Promise<Record<string, string>> => {
  // Sign the request with service worker's private key
  return await signServiceWorkerRequest(algorithm, privateKey, headers, body);
};
