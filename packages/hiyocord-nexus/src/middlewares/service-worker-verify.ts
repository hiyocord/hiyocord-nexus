import { createMiddleware } from "hono/factory";
import { verifyRequest } from "@hiyocord/hiyocord-nexus-core";
import { cloneRawRequest } from "hono/request";
import { ManifestLatestVersion } from "@hiyocord/hiyocord-nexus-types";
import { HonoEnv } from "../types";

/**
 * Middleware to verify service worker authentication
 * Verifies public key signature from manifest
 *
 * Used when service workers call Nexus APIs (e.g., Discord API Proxy)
 * Requires X-Hiyocord-Manifest-Id header to identify the service worker
 */
export const verifyServiceWorker = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    // 1. Get manifest ID from header
    const manifestId = c.req.header("X-Hiyocord-Manifest-Id");
    if (!manifestId) {
      console.error("Missing X-Hiyocord-Manifest-Id header");
      return c.json({ error: "Missing manifest ID" }, 401);
    }

    // 2. Get service worker's public key from manifest
    const manifest = await c.env.KV.get(`manifest:${manifestId}`, "json") as ManifestLatestVersion;

    if (!manifest) {
      console.error(`Manifest not found: ${manifestId}`);
      return c.json({ error: "Manifest not found" }, 401);
    }

    if (!manifest.public_key || !manifest.signature_algorithm) {
      console.error(`Public key or algorithm not found in manifest: ${manifestId}`);
      return c.json({ error: "Service worker public key not configured" }, 401);
    }

    // 3. Verify signature with service worker's public key
    const verified = await verifyRequest(
      manifest.signature_algorithm,
      manifest.public_key,
      c.req.header(),
      await (await cloneRawRequest(c.req)).arrayBuffer()
    );

    if (!verified) {
      console.error(`Signature verification failed for manifest: ${manifestId}`);
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Store manifest ID in context for later use
    c.set("manifestId", manifestId);

    return await next();
  } catch (error) {
    console.error("Service worker verification failed:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
});
