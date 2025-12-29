import type { KVNamespace } from '@cloudflare/workers-types';
import { Hono } from "hono";

export type HonoEnv = {
  Bindings: {
    KV: KVNamespace;
    DISCORD_APPLICATION_ID: string;
    DISCORD_BOT_TOKEN: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_PUBLIC_KEY: string;
    NEXUS_PRIVATE_KEY: string; // Ed25519 private key for signing requests to service workers
    NEXUS_PUBLIC_KEY: string; // Ed25519 public key (for distribution to service workers)
    NEXUS_SIGNATURE_ALGORITHM?: string; // Signature algorithm (default: ed25519)
  },
  Variables: {
    manifestId: string; // Service worker manifest ID (set by verifyServiceWorker middleware)
  }
}

export type AppType = Hono<HonoEnv>;


