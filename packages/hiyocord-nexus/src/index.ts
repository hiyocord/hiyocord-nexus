import { Hono } from "hono";
import { HonoEnv } from "./types";
import interactions from "./interactions";
import manifest from "./manifest";
import webhook from "./webhook";
import discordProxy from "./discord-proxy";

const app = new Hono<HonoEnv>();

interactions(app);
manifest(app);
webhook(app);
discordProxy(app);

export default app

