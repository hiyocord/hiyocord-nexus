#!/usr/bin/env node
/**
 * Generate Ed25519 key pair for Hiyocord authentication
 *
 * Usage:
 *   npx tsx scripts/generate-keypair.ts
 *
 * Outputs:
 *   - Public key (base64-encoded) - Share with other services
 *   - Private key (base64-encoded) - Keep secret, store in environment variables
 */

import { webcrypto } from 'crypto';

// Polyfill for Node.js < 19
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

const base64 = {
  encode: (buffer: ArrayBuffer): string => {
    return Buffer.from(buffer).toString('base64');
  },
};

async function generateKeyPair() {
  console.error('Generating Ed25519 key pair...\n');

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = base64.encode(publicKeyBuffer);
  const privateKey = base64.encode(privateKeyBuffer);

  const result = {
    "algorithm": "ed25519",
    "public_key": publicKey,
    "private_key": privateKey
  }

  console.log(JSON.stringify(result))

  console.error('✓ Key pair generated successfully!\n');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('PUBLIC KEY (share with service workers / Nexus):');
  console.error('═══════════════════════════════════════════════════════════');
  console.error(publicKey);
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('PRIVATE KEY (keep secret, store in environment variables):');
  console.error('═══════════════════════════════════════════════════════════');
  console.error(privateKey);
  console.error('');
  console.error('ALGORITHM: ed25519');
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('SETUP INSTRUCTIONS:');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('');
  console.error('For Nexus (signs requests TO service workers):');
  console.error('  wrangler secret put NEXUS_PRIVATE_KEY');
  console.error('  wrangler secret put NEXUS_PUBLIC_KEY');
  console.error('  wrangler secret put NEXUS_SIGNATURE_ALGORITHM  # Set to: ed25519');
  console.error('');
  console.error('For Service Workers (verify requests FROM Nexus):');
  console.error('  wrangler secret put NEXUS_PUBLIC_KEY  # Use Nexus\'s public key');
  console.error('');
  console.error('For Service Workers (sign requests TO Nexus):');
  console.error('  wrangler secret put SERVICE_WORKER_PRIVATE_KEY');
  console.error('  # Add public_key and signature_algorithm to your manifest.json');
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
}

generateKeyPair().catch((error) => {
  console.error('Error generating key pair:', error);
  process.exit(1);
});
