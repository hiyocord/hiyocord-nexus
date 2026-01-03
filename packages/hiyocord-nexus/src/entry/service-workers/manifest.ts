import { Hono } from "hono"
import { HonoEnv } from "../../types"
import type { Manifest } from '@hiyocord/hiyocord-nexus-types'
import { createApplicationContext } from "../../application-context"
import { ManifestRegisterService, ManifestDeleteService } from "../../usecase/manifest"

export default (app: Hono<HonoEnv>) => {
  app.post("/manifest", async (c) => {
    const manifest = await c.req.json() as Manifest
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestRegisterService(ctx, manifest)

    // Discordコマンド登録を非同期実行
    c.executionCtx.waitUntil(registerDiscordCommands())

    return c.json({}, 200)
  })

  app.delete("/manifest/:id", async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestDeleteService(ctx, manifestId)

    if (!registerDiscordCommands) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    // Discordコマンド再登録を非同期実行
    c.executionCtx.waitUntil(registerDiscordCommands())

    return c.json({}, 200)
  })
}
