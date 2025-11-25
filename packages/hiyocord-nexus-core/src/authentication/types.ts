export interface SignatureInput {
  headers: Record<string, string>;
  body: ArrayBuffer;
  secret: string;
}
