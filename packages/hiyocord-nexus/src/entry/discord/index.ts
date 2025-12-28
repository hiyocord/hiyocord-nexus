import { Hono } from "hono";
import { HonoEnv } from "../../types";
import interaction from "./interaction";


export default (app: Hono<HonoEnv>) => {
  interaction(app);
}

