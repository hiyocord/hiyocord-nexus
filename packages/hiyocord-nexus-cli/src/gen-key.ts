import { defineCommand, } from "./command.js";


const base64 = {
  encode: (buffer: ArrayBuffer): string => {
    return Buffer.from(buffer).toString('base64');
  },
};


export default defineCommand("gen-key",
  {
    options: {
      format: {
        type: "string",
        default: "text"
      }
    }
  },
  async ({ values }) => {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const publicKey = base64.encode(publicKeyBuffer);
    const privateKey = base64.encode(privateKeyBuffer);

    if(values.format.toLowerCase() === "json") {
      const result = {
        "algorithm": "ed25519",
        "public_key": publicKey,
        "private_key": privateKey
      }
      console.log(JSON.stringify(result))
      return 0;
    }

    console.log(`public key: ${publicKey}`);
    console.log(`private key: ${privateKey}`);
    console.log("algorithm: ed25519");

    return 0;
  }
)
