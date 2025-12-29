import { Hono } from "hono";
import { HonoEnv } from "../../types";
import { createMiddleware } from "hono/factory";
import { DiscordApiProxyService } from "../../usecase/discord-api-proxy";
import { createApplicationContext } from "../../application-context";
import { JWTPayload, verifyJWT } from "../../jwt";
import { verifyRequest } from "@hiyocord/hiyocord-nexus-core/authentication/public-key-sign";
import { cloneRawRequest } from "hono/request";
import { Manifest } from "@hiyocord/hiyocord-nexus-types";

/**
 * Middleware to verify service worker authentication
 * Checks both JWT token and public key signature
 */
const verifyServiceWorker = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    // 1. Verify JWT token
    const token = c.req.header("Authorization") ?? "Bot ";
    const payload = await verifyJWT(
      c.env.JWT_SECRET,
      token.substring("Bot ".length),
    );

    c.set("payload", payload as JWTPayload);

    // 2. Get service worker's public key from manifest
    const manifestId = (payload as JWTPayload).manifest_id;
    const manifestJson = await c.env.KV.get(`manifest:${manifestId}`);

    if (!manifestJson) {
      console.error(`Manifest not found: ${manifestId}`);
      return c.json({ error: "Manifest not found" }, 401);
    }

    const manifest = JSON.parse(manifestJson) as Manifest;

    if (!manifest.public_key || !manifest.signature_algorithm) {
      console.error(`Public key or algorithm not found in manifest: ${manifestId}`);
      return c.json({ error: "Service worker public key not configured" }, 401);
    }

    // 3. Verify signature with service worker's public key
    const verified = await verifyRequest(
      manifest.public_key,
      c.req.header(),
      await (await cloneRawRequest(c.req)).arrayBuffer()
    );

    if (!verified) {
      console.error(`Signature verification failed for manifest: ${manifestId}`);
      return c.json({ error: "Invalid signature" }, 401);
    }

    return await next();
  } catch (error) {
    console.error("Service worker verification failed:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
})

export default (app: Hono<HonoEnv>) => {
  app.all("/proxy/discord/api/v10/*", verifyServiceWorker, async (c) => {
    const ctx = createApplicationContext(c)
    if(c.req.method == "GET") {
      return c.json(await DiscordApiProxyService(ctx, c.req.raw, null as any, c.var.payload));
    } else {
      return c.json(await DiscordApiProxyService(ctx, c.req.raw, await c.req.json(), c.var.payload));
    }
  })
}

