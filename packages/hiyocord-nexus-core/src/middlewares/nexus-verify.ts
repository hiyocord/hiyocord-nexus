import { createMiddleware } from "hono/factory";
import { verifySignature } from "../authentication";
import { cloneRawRequest } from "hono/request";

export const getNexusVerifyMiddleware = (secretEnv: string) => {
  return createMiddleware<{Bindings: {[secretEnv]: string}}>(async (c, next) => {
    const headerTimestamp = c.req.header("X-Hiyocord-Timestamp");
    const signature = c.req.header("X-Hiyocord-Signature");

    if (!(headerTimestamp && signature)) {
      return c.text("Missing required headers", { status: 401 });
    }

    const timestamp = new Date().getTime().toString();
    const timeDiff = Math.abs(parseInt(timestamp) - parseInt(headerTimestamp));
    const maxAllowedDiff = 60 * 1000; // 1 minutes

    if (timeDiff > maxAllowedDiff) {
      return c.text("Request timestamp is too old", { status: 401 });
    }

    if(!c.env[secretEnv]) {
      throw new Error(`${secretEnv} is undefined`)
    }

    const verify = await verifySignature({
      headers: c.req.header(),
      body: await (await cloneRawRequest(c.req)).arrayBuffer(),
      secret: c.env[secretEnv]
    }, signature);

    if(verify) {
      return await next();
    } else {
      return c.text("Invalid request signature", { status: 401 });
    }
  })
};

export const nexusVerifyMiddleware = getNexusVerifyMiddleware("HIYOCORD_SECRET");
