import { Hono } from "hono";

export type HonoEnv = {
  Bindings: {
    KV: KVNamespace;
    DISCORD_APPLICATION_ID: string;
    DISCORD_BOT_TOKEN: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_PUBLIC_KEY: string;
    HIYOCORD_SECRET: string;
    JWT_SECRET: string;
  }
}

export type AppType = Hono<HonoEnv>;


