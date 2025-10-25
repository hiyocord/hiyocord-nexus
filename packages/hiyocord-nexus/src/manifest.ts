import { Context } from "hono";
import { AppType, HonoEnv } from "./types";
import type { DiscordCommand, Manifest } from '@hiyocord/hiyocord-nexus-types';

const migrateManifest = (manifest: Manifest) => {
  if(/^1(\.[0-9]+(\.[0-9]+))?/.test(manifest.version)) {
    return manifest
  }
  throw new Error("Unknown manifest version.");

}

const mergeManifest = async (a: Manifest[], b: Manifest) => {
  const newManifest = migrateManifest(b)
  const excluded = a.filter(it => b.id !== it.id);
  excluded.push(newManifest)
  return excluded;
}

const getCommandObject = (manifests: Manifest[]) => {
  const guildCmdManifest = manifests.map(it => it.application_commands.guild)
      .filter(it => it.length !== 0)
      .flat()
  const guildId = Array.from(new Set(guildCmdManifest.map(it => it.guild_id).flat()))
  const guildCmd = guildId.reduce((pre, it) => {
    const commands = guildCmdManifest.filter(cmd => cmd.guild_id.includes(it))
    commands.map(cmd => {
      const {defer, guild_id, ...request} = cmd
      return request
    })
    return {...pre, [it]: commands}
  }, {} as {[k: string]: DiscordCommand[]})

  const globalCmd = manifests.map(it => it.application_commands.global)
      .filter(it => it.length !== 0).flat()
      .map(it => {
        const {defer, ...request} = it
        return request
      })

  return {
    global: globalCmd,
    guild: guildCmd
  }
}

const registerCommandSet = async (
  url: string,
  commands: DiscordCommand[],
  token: string
) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (res.ok) {
    console.log(`✅ Registered ${commands.length} command(s) to ${url}`);
  } else {
    const text = await res.text();
    console.error(`❌ Failed to register commands (${url}): ${res.status} ${text}`);
  }
}


export const getManifest = async (c: Context<HonoEnv>) => {
  const value = await c.env.KV.get("manifests", "json")
  if(value) {
    return value as Manifest[]
  } else {
    return []
  }
}

export default (app: AppType) => {
  app.post("/manifest", async (c) => {
    const o = await getManifest(c);
    const manifests = await mergeManifest(o, await c.req.json())
    await c.env.KV.put("manifests", JSON.stringify(manifests));
    c.executionCtx.waitUntil((async () => {
      const baseUrl = `https://discord.com/api/v10/applications/${c.env.DISCORD_APPLICATION_ID}`
      const {global, guild} = getCommandObject(manifests)
      await registerCommandSet(baseUrl, global, c.env.DISCORD_BOT_TOKEN);
      const req = Object.keys(guild).map(k => registerCommandSet(`${baseUrl}/guilds/${k}/commands`, guild[k], c.env.DISCORD_BOT_TOKEN))
      await Promise.all(req) // TODO wait?
    })())
    return c.json({}, 200)
  })
}
