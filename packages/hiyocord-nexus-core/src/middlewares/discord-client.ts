import { DefaultClient, getClient } from "@hiyocord/discord-rest-api";
import { createMiddleware } from "hono/factory";

type HonoType = {
  Variables: {
    client: DefaultClient
  }
}

export const discordClient = createMiddleware<HonoType>((c, next) => {
  const token = c.req.header("x-discord-token")
  if(token) {
    c.set("client", getClient(token))
  }
  return next()
})

