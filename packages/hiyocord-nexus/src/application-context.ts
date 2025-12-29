import type { KVNamespace } from '@cloudflare/workers-types';
import { Context } from "hono"
import { HonoEnv } from "./types"

export type ApplicationContext = {
  getManifestKv: () => KVNamespace;
  getTransferInteractionJwtSecret: () => string;
  getNexusPrivateKey: () => string;
  getNexusPublicKey: () => string;
  getNexusSignatureAlgorithm: () => string;
  discord: {
    getApplicationId: () => string;
    getToken: () => string;
    getClientSecret: () => string;
    getPublicKey: () => string;
  }
}

export const createApplicationContext = (ctx: Context<HonoEnv>): ApplicationContext => {
  return {
    getManifestKv: () => ctx.env.KV,
    getTransferInteractionJwtSecret: () => ctx.env.JWT_SECRET,
    getNexusPrivateKey: () => ctx.env.NEXUS_PRIVATE_KEY,
    getNexusPublicKey: () => ctx.env.NEXUS_PUBLIC_KEY,
    getNexusSignatureAlgorithm: () => ctx.env.NEXUS_SIGNATURE_ALGORITHM || 'ed25519',
    discord: {
      getApplicationId: () => ctx.env.DISCORD_APPLICATION_ID,
      getToken: () => ctx.env.DISCORD_BOT_TOKEN,
      getClientSecret: () => ctx.env.DISCORD_CLIENT_SECRET,
      getPublicKey: () => ctx.env.DISCORD_PUBLIC_KEY,
    },
  }
}
