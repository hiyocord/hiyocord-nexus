import { Hono } from "hono";
import { HonoEnv } from "../../types";
import { createMiddleware } from "hono/factory";
import { DiscordApiProxyService } from "../../usecase/discord-api-proxy";
import { createApplicationContext } from "../../application-context";
import { JWTPayload, verifyJWT } from "../../jwt";

const verifyJwt = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    const token = c.req.header("Authorization") ?? "Bot ";
    console.error(`token: "${token.substring("Bot ".length)}"`)
    const payload = await verifyJWT(
      c.env.JWT_SECRET,
      token.substring("Bot ".length),
    );

    c.set("payload", payload as JWTPayload);

    return await next();
  } catch (error) {
    console.error(error);
    return c.json({}, 401);
  }
})

export default (app: Hono<HonoEnv>) => {
  app.all("/proxy/discord/api/v10/*", verifyJwt, async (c) => {
    const ctx = createApplicationContext(c)
    if(c.req.method == "GET") {
      return c.json(await DiscordApiProxyService(ctx, c.req.raw, null as any, c.var.payload));
    } else {
      return c.json(await DiscordApiProxyService(ctx, c.req.raw, await c.req.json(), c.var.payload));
    }
  })
}

