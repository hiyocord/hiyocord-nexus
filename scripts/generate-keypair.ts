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
  console.log('Generating Ed25519 key pair...\n');

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = base64.encode(publicKeyBuffer);
  const privateKey = base64.encode(privateKeyBuffer);

  console.log('✓ Key pair generated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PUBLIC KEY (share with service workers / Nexus):');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(publicKey);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PRIVATE KEY (keep secret, store in environment variables):');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(privateKey);
  console.log('');
  console.log('ALGORITHM: ed25519');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SETUP INSTRUCTIONS:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('For Nexus (signs requests TO service workers):');
  console.log('  wrangler secret put NEXUS_PRIVATE_KEY');
  console.log('  wrangler secret put NEXUS_PUBLIC_KEY');
  console.log('  wrangler secret put NEXUS_SIGNATURE_ALGORITHM  # Set to: ed25519');
  console.log('');
  console.log('For Service Workers (verify requests FROM Nexus):');
  console.log('  wrangler secret put NEXUS_PUBLIC_KEY  # Use Nexus\'s public key');
  console.log('');
  console.log('For Service Workers (sign requests TO Nexus):');
  console.log('  wrangler secret put SERVICE_WORKER_PRIVATE_KEY');
  console.log('  # Add public_key and signature_algorithm to your manifest.json');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

generateKeyPair().catch((error) => {
  console.error('Error generating key pair:', error);
  process.exit(1);
});
