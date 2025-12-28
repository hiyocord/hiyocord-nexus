import { Hono } from "hono";
import { HonoEnv } from "./types";
import entry from "./entry";

const app = new Hono<HonoEnv>()

entry(app);

export default app;
