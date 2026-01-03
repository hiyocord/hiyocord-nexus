import { LinearRouter } from 'hono/router/linear-router';
import { ManifestLatestVersion } from "@hiyocord/hiyocord-nexus-types";
import { ApplicationContext } from "../application-context";
import { DiscordApiRepository } from '../infrastructure/discord-api';
import { ManifestStore } from '../infrastructure';


const isAllowed = (manifest: ManifestLatestVersion, method: string, endpoint: string) => {
  const permissions = manifest.permissions ?? []
  console.error(`permissions: ${JSON.stringify(permissions)}`)
  if(permissions.find(it => it.type === "DISCORD_BOT") !== undefined) {
    return true;
  }

  for(const it of permissions) {
    if(it.type === "DISCORD_API_SCOPE") {
      const router = new LinearRouter()
      for(const [path, methods] of Object.entries(it.scopes)) {
        methods.forEach(method => router.add(method, path, () => {}))
      }
      return router.match(method, endpoint);
    }
  }
  return false;
}


export const DiscordApiProxyService = async (ctx: ApplicationContext, request: Request, manifestId: string) => {
  const manifest = await ManifestStore(ctx).findById(manifestId)

  const path = request.url.substring((request.headers.get("Host")?.length ?? 0) + "/proxy/discord/api/v10".length)
  console.log(`path: ${path}`)
  if(isAllowed(manifest!, request.method, path)) {
    const response = await DiscordApiRepository(ctx).client(request)
    console.error(await response.clone().text())
    const json = await response.json()
    console.error(json);
    return json;
  } else {
    throw 403
  }
}
