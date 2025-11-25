import { createMiddleware } from "hono/factory";
import { verifySignature } from "../authentication";

export const getNexusVerifyMiddleware = (secretEnv: string) => {
  return createMiddleware<{Bindings: {[secretEnv]: string}}>(async (c, next) => {
    const headerTimestamp = c.req.header("X-Request-Timestamp");
    const signature = c.req.header("X-Request-Signature");

    if (!(headerTimestamp && signature)) {
      return c.status(401);
    }

    const timestamp = new Date().getTime().toString();
    const timeDiff = Math.abs(parseInt(timestamp) - parseInt(headerTimestamp));
    const maxAllowedDiff = 60 * 1000; // 1 minutes

    if (timeDiff > maxAllowedDiff) {
      return c.status(401);
    }

    const verify = await verifySignature({
      headers: c.req.header(),
      body: await c.req.arrayBuffer(),
      secret: c.env[secretEnv]
    }, signature);

    if(verify) {
      return next();
    } else {
      return c.status(401);
    }
  })
};

export const nexusVerifyMiddleware = getNexusVerifyMiddleware("HIYOCORD_SECRET");
