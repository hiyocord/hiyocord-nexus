import { describe, it, expect, beforeAll } from 'vitest';
import { signRequest, verifyRequest, createSigningPayload } from './public-key-sign';
import { getAlgorithm } from './signature-algorithm';

describe('public-key-sign', () => {
  let publicKey: string;
  let privateKey: string;

  beforeAll(async () => {
    const algorithm = getAlgorithm('ed25519');
    const keyPair = await algorithm.generateKeyPair();
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;
  });

  describe('createSigningPayload', () => {
    it('should create payload from headers and body', () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value',
      };
      const body = new TextEncoder().encode('{"data":"test"}').buffer;

      const payload = createSigningPayload(headers, body);

      expect(payload).toBeInstanceOf(ArrayBuffer);
      expect(payload.byteLength).toBeGreaterThan(0);
    });

    it('should create payload with empty body', () => {
      const headers = {
        'Content-Type': 'application/json',
      };
      const body = undefined;

      const payload = createSigningPayload(headers, body);

      expect(payload).toBeInstanceOf(ArrayBuffer);
    });

    it('should sort headers canonically', () => {
      const headers1 = {
        'Z-Header': 'z',
        'A-Header': 'a',
        'M-Header': 'm',
      };
      const headers2 = {
        'M-Header': 'm',
        'A-Header': 'a',
        'Z-Header': 'z',
      };

      const payload1 = createSigningPayload(headers1, undefined);
      const payload2 = createSigningPayload(headers2, undefined);

      // 同じヘッダーは同じペイロードを生成する
      const array1 = new Uint8Array(payload1);
      const array2 = new Uint8Array(payload2);

      expect(array1.length).toBe(array2.length);
      expect(Array.from(array1)).toEqual(Array.from(array2));
    });

    it('should exclude CF-* headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'CF-Ray': 'should-be-excluded',
        'CF-IPCountry': 'should-be-excluded',
        'X-Custom': 'included',
      };

      const payload = createSigningPayload(headers, undefined);
      const payloadStr = new TextDecoder().decode(payload);

      expect(payloadStr.toLowerCase()).not.toContain('cf-ray');
      expect(payloadStr.toLowerCase()).not.toContain('cf-ipcountry');
      expect(payloadStr.toLowerCase()).toContain('x-custom');
    });
  });

  describe('signRequest and verifyRequest', () => {
    it('should sign and verify request successfully', async () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test',
      };
      const body = new TextEncoder().encode('{"message":"hello"}').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);

      // 署名ヘッダーが追加されていることを確認
      expect(signedHeaders['X-Hiyocord-Signature']).toBeDefined();
      expect(signedHeaders['X-Hiyocord-Timestamp']).toBeDefined();
      expect(signedHeaders['X-Hiyocord-Algorithm']).toBe('ed25519');

      // 元のヘッダーも含まれていることを確認
      expect(signedHeaders['Content-Type']).toBe('application/json');
      expect(signedHeaders['X-Custom-Header']).toBe('test');

      // 検証
      const isValid = await verifyRequest('ed25519', publicKey, signedHeaders, body);
      expect(isValid).toBe(true);
    });

    it('should verify request with no body', async () => {
      const headers = {
        'Content-Type': 'application/json',
      };

      const signedHeaders = await signRequest('ed25519', privateKey, headers, undefined);
      const isValid = await verifyRequest('ed25519', publicKey, signedHeaders, undefined);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong public key', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const body = new TextEncoder().encode('test').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);

      // 別の公開鍵を生成
      const algorithm = getAlgorithm('ed25519');
      const { publicKey: wrongPublicKey } = await algorithm.generateKeyPair();

      const isValid = await verifyRequest('ed25519', wrongPublicKey, signedHeaders, body);
      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered body', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const originalBody = new TextEncoder().encode('original').buffer;
      const tamperedBody = new TextEncoder().encode('tampered').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, originalBody);
      const isValid = await verifyRequest('ed25519', publicKey, signedHeaders, tamperedBody);

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered headers', async () => {
      const headers = { 'Content-Type': 'application/json', 'X-Data': 'original' };
      const body = new TextEncoder().encode('test').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);

      // ヘッダーを改ざん
      const tamperedHeaders = { ...signedHeaders, 'X-Data': 'tampered' };

      const isValid = await verifyRequest('ed25519', publicKey, tamperedHeaders, body);
      expect(isValid).toBe(false);
    });

    it('should fail verification with missing signature', async () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Hiyocord-Timestamp': Date.now().toString(),
        'X-Hiyocord-Signature-Algorithm': 'ed25519',
      };
      const body = new TextEncoder().encode('test').buffer;

      const isValid = await verifyRequest('ed25519', publicKey, headers, body);
      expect(isValid).toBe(false);
    });

    it('should fail verification with expired timestamp', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const body = new TextEncoder().encode('test').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);

      // タイムスタンプを60秒以上前に設定
      const expiredHeaders = {
        ...signedHeaders,
        'X-Hiyocord-Timestamp': (Date.now() - 61000).toString(),
      };

      const isValid = await verifyRequest('ed25519', publicKey, expiredHeaders, body);
      expect(isValid).toBe(false);
    });

    it('should fail verification with missing timestamp', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const body = new TextEncoder().encode('test').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);
      delete signedHeaders['X-Hiyocord-Timestamp'];

      const isValid = await verifyRequest('ed25519', publicKey, signedHeaders, body);
      expect(isValid).toBe(false);
    });

    it('should handle large request body', async () => {
      const headers = { 'Content-Type': 'application/octet-stream' };
      // 1MBのボディ
      const largeBody = new Uint8Array(1024 * 1024).fill(42).buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, largeBody);
      const isValid = await verifyRequest('ed25519', publicKey, signedHeaders, largeBody);

      expect(isValid).toBe(true);
    });

    it('should preserve all original headers', async () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-Custom-1': 'value1',
        'X-Custom-2': 'value2',
        'User-Agent': 'test-agent',
      };
      const body = new TextEncoder().encode('test').buffer;

      const signedHeaders = await signRequest('ed25519', privateKey, headers, body);

      // すべての元のヘッダーが保持されていることを確認
      expect(signedHeaders['Content-Type']).toBe('application/json');
      expect(signedHeaders['Authorization']).toBe('Bearer token');
      expect(signedHeaders['X-Custom-1']).toBe('value1');
      expect(signedHeaders['X-Custom-2']).toBe('value2');
      expect(signedHeaders['User-Agent']).toBe('test-agent');
    });
  });

  describe('error handling', () => {
    it('should throw error when signing with invalid private key', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const body = new TextEncoder().encode('test').buffer;

      await expect(
        signRequest('ed25519', 'invalid-key', headers, body)
      ).rejects.toThrow();
    });

    it('should return false when verifying with invalid public key format', async () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-Hiyocord-Signature': 'some-signature',
        'X-Hiyocord-Timestamp': Date.now().toString(),
        'X-Hiyocord-Signature-Algorithm': 'ed25519',
      };
      const body = new TextEncoder().encode('test').buffer;

      const isValid = await verifyRequest('ed25519', 'invalid-key', headers, body);
      expect(isValid).toBe(false);
    });
  });
});
