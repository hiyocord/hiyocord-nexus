import { cors } from "hono/cors"
import { AppType } from "../../types"
import auth from "./auth"
import manifest from "./manifest"

export default (app: AppType) => {
  app.use(
    '/api/*',
    cors({
        origin: (origin, ctx) => {
          if (!origin) { // not browser
            return null;
          }
          const host = new URL(origin).host;
          console.error(`origin: ${ctx.req.method} ${ctx.req.path} ${origin} ${host}`)
          if(host === "nexus.hiyocord.org") {
            return origin;
          } else if(host.endsWith('.nexus.hiyocord.org')) {
            return origin;
          }
          return null;
        },
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["content-type"],
        credentials: true,
      }
    )
  )

  auth(app)
  manifest(app)
}
