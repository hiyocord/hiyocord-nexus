import { Hono } from "hono";
import { HonoEnv } from "../../types";
import discordApiProxy from "./discord-api-proxy";
import manifest from "../api/manifest";
import nexusPublicKey from "./nexus-public-key";


export default (app: Hono<HonoEnv>) => {
  nexusPublicKey(app);
  discordApiProxy(app);
  manifest(app);
}

