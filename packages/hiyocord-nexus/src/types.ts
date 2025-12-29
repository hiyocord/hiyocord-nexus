import type { KVNamespace } from '@cloudflare/workers-types';
import { Hono } from "hono";
import { JWTPayload } from './jwt';

export type HonoEnv = {
  Bindings: {
    KV: KVNamespace;
    DISCORD_APPLICATION_ID: string;
    DISCORD_BOT_TOKEN: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_PUBLIC_KEY: string;
    JWT_SECRET: string;
    NEXUS_PRIVATE_KEY: string; // Ed25519 private key for signing requests to service workers
    NEXUS_PUBLIC_KEY: string; // Ed25519 public key (for distribution to service workers)
    NEXUS_SIGNATURE_ALGORITHM?: string; // Signature algorithm (default: ed25519)
  },
  Variables: {
    payload: JWTPayload
  }
}

export type AppType = Hono<HonoEnv>;


