import { Hono } from "hono"
import { HonoEnv } from "../../types"
import type { ManifestAnyVersion } from '@hiyocord/hiyocord-nexus-types'
import { createApplicationContext } from "../../application-context"
import { ManifestRegisterService, ManifestDeleteService } from "../../usecase/manifest"

export default (app: Hono<HonoEnv>) => {
  app.post("/api/manifest", async (c) => {
    const manifest = await c.req.json() as ManifestAnyVersion
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestRegisterService(ctx, manifest)

    // Discordコマンド登録を同期実行（3秒ルールがないため）
    await registerDiscordCommands()

    return c.json({}, 200)
  })

  app.delete("/api/manifest/:id", async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestDeleteService(ctx, manifestId)

    if (!registerDiscordCommands) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    // Discordコマンド再登録を同期実行（3秒ルールがないため）
    await registerDiscordCommands()

    return c.json({}, 200)
  })
}
