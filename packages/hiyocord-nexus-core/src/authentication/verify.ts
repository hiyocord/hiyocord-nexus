import { SignatureInput } from "./types";
import { generateSignature } from "./sign";

export const verifySignature = async (input: SignatureInput, signature: string) => {
  const expected = await generateSignature(input);
  return expected === signature;
}
