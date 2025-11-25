import { SignatureInput } from "./types";

const concatBuffers = (buffers: Uint8Array[]) => {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

const toHex = (buffer: ArrayBuffer) =>{
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const generateSignature = async (input: SignatureInput) => {

  const { headers, body, secret } = input;
  const encoder = new TextEncoder();

  // ヘッダ canonicalize
  const sortedHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k.toLowerCase()}:${headers[k]}`)
    .join("\n");

  const headerBytes = encoder.encode(sortedHeaders);
  const payload = concatBuffers([headerBytes, new Uint8Array(body)]);

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, payload);
  return toHex(signatureBuffer);
}

export const sign = async (secret: string, headers: Record<string, string>, body: ArrayBuffer | undefined) => {
  const timestamp = new Date().getTime().toString();
  headers = {
    ...headers,
    "X-Request-Timestamp": timestamp,
  };
  return {
    ...headers,
    "X-Request-Signature": await generateSignature({
        headers: headers,
        body: body ? body : new ArrayBuffer(0),
        secret: secret
      }),
  };
}

