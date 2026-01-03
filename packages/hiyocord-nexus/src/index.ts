import { Hono } from "hono";
import { HonoEnv } from "./types";
import entry from "./entry";

const app = new Hono<HonoEnv>()

entry(app);

app.onError((e, ctx) => {
  console.error(String.raw`
    ${e.name}: ${e.message}
    ${e.stack}
    `
  )
  return ctx.json({}, 500)
})

export default app;
