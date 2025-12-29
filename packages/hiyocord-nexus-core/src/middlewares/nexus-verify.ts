import { createMiddleware } from "hono/factory";
import { verifyRequest } from "../authentication/public-key-sign";
import { cloneRawRequest } from "hono/request";

/**
 * Middleware to verify Nexus signature using public key cryptography
 * Service workers should use this middleware to verify requests from Nexus
 *
 * @param publicKeyEnv - Environment variable name containing Nexus's public key
 */
export const getNexusVerifyMiddleware = (publicKeyEnv: string) => {
  return createMiddleware<{Bindings: {[publicKeyEnv]: string}}>(async (c, next) => {
    const headerTimestamp = c.req.header("X-Hiyocord-Timestamp");
    const signature = c.req.header("X-Hiyocord-Signature");
    const algorithm = c.req.header("X-Hiyocord-Algorithm");

    if (!(headerTimestamp && signature && algorithm)) {
      return c.text("Missing required headers (X-Hiyocord-Timestamp, X-Hiyocord-Signature, X-Hiyocord-Algorithm)", { status: 401 });
    }

    const publicKey = c.env[publicKeyEnv];
    if (!publicKey) {
      throw new Error(`Environment variable ${publicKeyEnv} is not configured`);
    }

    const verify = await verifyRequest(
      publicKey,
      c.req.header(),
      await (await cloneRawRequest(c.req)).arrayBuffer()
    );

    if (verify) {
      return await next();
    } else {
      return c.text("Invalid request signature", { status: 401 });
    }
  })
};

/**
 * Default middleware instance using NEXUS_PUBLIC_KEY environment variable
 */
export const nexusVerifyMiddleware = getNexusVerifyMiddleware("NEXUS_PUBLIC_KEY");
