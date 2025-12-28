import { Hono } from "hono";
import { HonoEnv } from "../../types";
import { verifyKey } from "discord-interactions";
import { createMiddleware } from "hono/factory";
import { InteractionTransferService } from "../../usecase/interaction";
import { createApplicationContext } from "../../application-context";
import { cloneRawRequest } from "hono/request";

const verify = createMiddleware<HonoEnv>(async (c, next) => {
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


export default (app: Hono<HonoEnv>) => {
  app.post("/interactions", verify, async c => {
    const ctx = createApplicationContext(c)
    return c.json(await InteractionTransferService(ctx, await cloneRawRequest(c.req), await c.req.json()))
  })
}

