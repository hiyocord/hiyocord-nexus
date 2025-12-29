/**
 * Signature algorithm abstraction for public key cryptography
 * Allows easy switching between different algorithms (Ed25519, ECDSA, RSA-PSS, etc.)
 */

export type AlgorithmName = 'ed25519' | 'ecdsa-p256' | 'rsa-pss-2048';

export interface SignatureAlgorithm {
  /**
   * Algorithm name (e.g., "ed25519")
   */
  readonly name: AlgorithmName;

  /**
   * Sign data with private key
   * @param privateKey Base64-encoded private key
   * @param data Data to sign
   * @returns Base64-encoded signature
   */
  sign(privateKey: string, data: ArrayBuffer): Promise<string>;

  /**
   * Verify signature with public key
   * @param publicKey Base64-encoded public key
   * @param signature Base64-encoded signature
   * @param data Original data
   * @returns true if signature is valid
   */
  verify(publicKey: string, signature: string, data: ArrayBuffer): Promise<boolean>;

  /**
   * Generate a new key pair
   * @returns Base64-encoded public and private keys
   */
  generateKeyPair(): Promise<{ publicKey: string; privateKey: string }>;
}

/**
 * Base64 encoding/decoding utilities
 */
const base64 = {
  encode: (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  },
  decode: (str: string): ArrayBuffer => {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer;
  }
};

/**
 * Ed25519 implementation using Web Crypto API
 */
export class Ed25519Algorithm implements SignatureAlgorithm {
  readonly name: AlgorithmName = 'ed25519';

  async sign(privateKey: string, data: ArrayBuffer): Promise<string> {
    const keyBuffer = base64.decode(privateKey);
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'Ed25519' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'Ed25519',
      cryptoKey,
      data
    );

    return base64.encode(signature);
  }

  async verify(publicKey: string, signature: string, data: ArrayBuffer): Promise<boolean> {
    try {
      const keyBuffer = base64.decode(publicKey);
      const signatureBuffer = base64.decode(signature);

      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'Ed25519' },
        false,
        ['verify']
      );

      return await crypto.subtle.verify(
        'Ed25519',
        cryptoKey,
        signatureBuffer,
        data
      );
    } catch {
      return false;
    }
  }

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: base64.encode(publicKeyBuffer),
      privateKey: base64.encode(privateKeyBuffer)
    };
  }
}

/**
 * Algorithm registry
 */
const algorithms: Record<AlgorithmName, SignatureAlgorithm> = {
  'ed25519': new Ed25519Algorithm(),
  'ecdsa-p256': new Ed25519Algorithm(), // Placeholder for future implementation
  'rsa-pss-2048': new Ed25519Algorithm(), // Placeholder for future implementation
};

/**
 * Get algorithm instance by name
 */
export function getAlgorithm(name: AlgorithmName): SignatureAlgorithm {
  const algorithm = algorithms[name];
  if (!algorithm) {
    throw new Error(`Unsupported signature algorithm: ${name}`);
  }
  return algorithm;
}
