import { AppType } from "../types";
import discord from "./discord";
import serviceWorkers from "./service-workers";

export default (app: AppType) => {
  discord(app);
  serviceWorkers(app);
}

