import { describe, it, expect } from 'vitest';
import { Ed25519Algorithm, getAlgorithm } from './signature-algorithm';

describe('Ed25519Algorithm', () => {
  const algorithm = new Ed25519Algorithm();

  describe('generateKeyPair', () => {
    it('should generate a valid Ed25519 key pair', async () => {
      const { publicKey, privateKey } = await algorithm.generateKeyPair();

      // Base64エンコードされた文字列であることを確認
      expect(publicKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(privateKey).toMatch(/^[A-Za-z0-9+/]+=*$/);

      // 長さの確認（SPKI/PKCS8フォーマットなので32バイトより大きい）
      const pubKeyBuffer = Buffer.from(publicKey, 'base64');
      const privKeyBuffer = Buffer.from(privateKey, 'base64');

      expect(pubKeyBuffer.length).toBeGreaterThan(32);
      expect(privKeyBuffer.length).toBeGreaterThan(32);
    });

    it('should generate different key pairs on each call', async () => {
      const keyPair1 = await algorithm.generateKeyPair();
      const keyPair2 = await algorithm.generateKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('sign and verify', () => {
    it('should sign and verify data correctly', async () => {
      const { publicKey, privateKey } = await algorithm.generateKeyPair();
      const data = new TextEncoder().encode('test message').buffer;

      const signature = await algorithm.sign(privateKey, data);
      const isValid = await algorithm.verify(publicKey, signature, data);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong public key', async () => {
      const { privateKey } = await algorithm.generateKeyPair();
      const { publicKey: wrongPublicKey } = await algorithm.generateKeyPair();
      const data = new TextEncoder().encode('test message').buffer;

      const signature = await algorithm.sign(privateKey, data);
      const isValid = await algorithm.verify(wrongPublicKey, signature, data);

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered data', async () => {
      const { publicKey, privateKey } = await algorithm.generateKeyPair();
      const originalData = new TextEncoder().encode('original message').buffer;
      const tamperedData = new TextEncoder().encode('tampered message').buffer;

      const signature = await algorithm.sign(privateKey, originalData);
      const isValid = await algorithm.verify(publicKey, signature, tamperedData);

      expect(isValid).toBe(false);
    });

    it('should fail verification with invalid signature', async () => {
      const { publicKey } = await algorithm.generateKeyPair();
      const data = new TextEncoder().encode('test message').buffer;
      const invalidSignature = 'invalid-signature';

      const isValid = await algorithm.verify(publicKey, invalidSignature, data);

      expect(isValid).toBe(false);
    });

    it('should handle empty data', async () => {
      const { publicKey, privateKey } = await algorithm.generateKeyPair();
      const emptyData = new ArrayBuffer(0);

      const signature = await algorithm.sign(privateKey, emptyData);
      const isValid = await algorithm.verify(publicKey, signature, emptyData);

      expect(isValid).toBe(true);
    });

    it('should handle large data', async () => {
      const { publicKey, privateKey } = await algorithm.generateKeyPair();
      // 1MBのデータ
      const largeData = new Uint8Array(1024 * 1024).fill(42).buffer;

      const signature = await algorithm.sign(privateKey, largeData);
      const isValid = await algorithm.verify(publicKey, signature, largeData);

      expect(isValid).toBe(true);
    });
  });

  describe('name property', () => {
    it('should return "ed25519"', () => {
      expect(algorithm.name).toBe('ed25519');
    });
  });
});

describe('getAlgorithm', () => {
  it('should return Ed25519Algorithm for "ed25519"', () => {
    const algorithm = getAlgorithm('ed25519');
    expect(algorithm).toBeInstanceOf(Ed25519Algorithm);
    expect(algorithm.name).toBe('ed25519');
  });

  it('should throw error for unsupported algorithm', () => {
    expect(() => getAlgorithm('unsupported' as any)).toThrow(
      'Unsupported signature algorithm: unsupported'
    );
  });

  it('should return placeholder Ed25519Algorithm for ecdsa-p256 (placeholder)', () => {
    // 現在はプレースホルダーとしてEd25519を使用
    const algorithm = getAlgorithm('ecdsa-p256');
    expect(algorithm).toBeInstanceOf(Ed25519Algorithm);
  });

  it('should return placeholder Ed25519Algorithm for rsa-pss-2048 (placeholder)', () => {
    // 現在はプレースホルダーとしてEd25519を使用
    const algorithm = getAlgorithm('rsa-pss-2048');
    expect(algorithm).toBeInstanceOf(Ed25519Algorithm);
  });
});
