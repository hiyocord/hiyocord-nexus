import { verifyKey } from "discord-interactions";
import { createMiddleware } from "hono/factory";
import { HonoEnv } from "./types";

export default createMiddleware<HonoEnv>(async (c, next) => {
    const signature = c.req.header('X-Signature-Ed25519');
    const timestamp = c.req.header('X-Signature-Timestamp');
    if(signature == undefined || timestamp == undefined) {
      return c.json({message: 'invalid request signature'}, 401);
    }
    const isValidRequest = await verifyKey(await c.req.arrayBuffer(), signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      return c.json({message: 'invalid request signature'}, 401);
    }
    return next();
})
