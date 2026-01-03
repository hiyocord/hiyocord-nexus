import { AppType } from "../types";
import discord from "./discord";
import serviceWorkers from "./service-workers";
import api from "./api";

export default (app: AppType) => {
  discord(app);
  serviceWorkers(app);
  api(app);
}

