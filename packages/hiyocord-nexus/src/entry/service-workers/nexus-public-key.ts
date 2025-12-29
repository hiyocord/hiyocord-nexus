import { Hono } from "hono";
import { HonoEnv } from "../../types";
import { getAlgorithm } from "@hiyocord/hiyocord-nexus-core/authentication/signature-algorithm";

/**
 * GET /.well-known/nexus-public-key
 * Returns Nexus's public key for service workers to verify signatures
 */
export default (app: Hono<HonoEnv>) => {
  app.get("/.well-known/nexus-public-key", async (c) => {
    const algorithm = c.env.NEXUS_SIGNATURE_ALGORITHM || 'ed25519';
    const publicKey = c.env.NEXUS_PUBLIC_KEY;

    if (!publicKey) {
      return c.json(
        { error: "Nexus public key not configured" },
        { status: 500 }
      );
    }

    // Validate algorithm is supported
    try {
      getAlgorithm(algorithm as any);
    } catch {
      return c.json(
        { error: `Unsupported algorithm: ${algorithm}` },
        { status: 500 }
      );
    }

    return c.json({
      algorithm,
      public_key: publicKey,
    });
  });
};
