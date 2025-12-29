import { Hono } from "hono";
import { HonoEnv } from "../../types";
import { DiscordApiProxyService } from "../../usecase/discord-api-proxy";
import { createApplicationContext } from "../../application-context";
import { verifyServiceWorker } from "../../middlewares/service-worker-verify";

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

