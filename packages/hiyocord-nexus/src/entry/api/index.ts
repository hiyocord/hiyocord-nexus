import { cors } from "hono/cors"
import { AppType } from "../../types"
import auth from "./auth"
import manifest from "./manifest"

export default (app: AppType) => {
  app.use(
    '/api/*',
    (c, next) => {
      const corsMiddlewareHandler = cors({
        origin: [
          // TODO get from env
          'http://localhost:5173',
          'https://dash.nexus.hiyocord.org'
        ],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
      })
      return corsMiddlewareHandler(c, next)
    }
  )

  auth(app)
  manifest(app)
}
