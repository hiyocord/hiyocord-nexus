import { Hono } from "hono"
import { HonoEnv } from "../../types"
import type { ManifestAnyVersion } from '@hiyocord/hiyocord-nexus-types'
import { createApplicationContext } from "../../application-context"
import { ManifestRegisterService, ManifestDeleteService } from "../../usecase/manifest"
import { ManifestStore } from "../../infrastructure/manifest"
import { requireAuth } from "../../middleware/auth"

export default (app: Hono<HonoEnv>) => {
  // Web API: マニフェスト一覧取得
  app.get("/api/manifests", requireAuth, async (c) => {
    const ctx = createApplicationContext(c)
    const manifestStore = ManifestStore(ctx)

    const manifests = await manifestStore.findAll()

    return c.json(manifests, 200)
  })

  // Web API: マニフェスト詳細取得
  app.get("/api/manifests/:id", requireAuth, async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)
    const manifestStore = ManifestStore(ctx)

    const manifest = await manifestStore.findById(manifestId)

    if (!manifest) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    return c.json(manifest, 200)
  })

  // Web API: マニフェスト削除
  app.delete("/api/manifests/:id", requireAuth, async (c) => {
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

  // Service Worker API: マニフェスト登録
  app.post("/api/manifest", async (c) => {
    const manifest = await c.req.json() as ManifestAnyVersion
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestRegisterService(ctx, manifest)

    // Discordコマンド登録を同期実行（3秒ルールがないため）
    await registerDiscordCommands()

    return c.json({}, 200)
  })

  // 旧エンドポイント（後方互換性のため残す）
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
