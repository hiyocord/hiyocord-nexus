import { Hono } from "hono";
import { HonoEnv } from "../../types";
import discordApiProxy from "./discord-api-proxy";
import manifest from "./manifest";


export default (app: Hono<HonoEnv>) => {
  discordApiProxy(app);
  manifest(app);
}

