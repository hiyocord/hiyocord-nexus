import { Hono } from "hono"
import { HonoEnv } from "../../types"
import type { ManifestAnyVersion } from '@hiyocord/hiyocord-nexus-types'
import { createApplicationContext } from "../../application-context"
import { ManifestRegisterService, ManifestDeleteService } from "../../usecase/manifest"
import { ManifestApprovalService, ManifestRejectionService } from "../../usecase/manifest-approval"
import { ManifestStore } from "../../infrastructure/manifest"
import { ApprovalStore } from "../../infrastructure/approval"
import { requireAuth } from "../../middleware/auth"

export default (app: Hono<HonoEnv>) => {
  // Web API: マニフェスト一覧取得
  app.get("/api/manifests", requireAuth, async (c) => {
    const ctx = createApplicationContext(c)
    const manifestStore = ManifestStore(ctx)
    const approvalStore = ApprovalStore(ctx)

    const manifests = await manifestStore.findAll()

    // 各manifestに承認状態を付与
    const manifestsWithApproval = await Promise.all(
      manifests.map(async (manifest) => {
        const approvalStatus = await approvalStore.get(manifest.id)
        // 承認状態が存在しない場合はapprovedとして扱う（後方互換性）
        const status = approvalStatus ?? { status: 'approved' as const, updated_at: 0 }
        return {
          ...manifest,
          approval_status: status.status,
          approval_updated_at: status.updated_at
        }
      })
    )

    return c.json(manifestsWithApproval, 200)
  })

  // Service Worker API: マニフェスト登録
  // TODO 認証方法検討
  app.post("/api/manifests", async (c) => {
    const manifest = await c.req.json() as ManifestAnyVersion
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestRegisterService(ctx, manifest)

    // Discordコマンド登録を同期実行（3秒ルールがないため）
    await registerDiscordCommands()

    return c.json({}, 200)
  })

  // Web API: マニフェスト詳細取得
  app.get("/api/manifests/:id", requireAuth, async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)
    const manifestStore = ManifestStore(ctx)
    const approvalStore = ApprovalStore(ctx)

    const manifest = await manifestStore.findById(manifestId)

    if (!manifest) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    // 承認状態を付与
    const approvalStatus = await approvalStore.get(manifestId)
    // 承認状態が存在しない場合はapprovedとして扱う（後方互換性）
    const status = approvalStatus ?? { status: 'approved' as const, updated_at: 0 }

    return c.json({
      ...manifest,
      approval_status: status.status,
      approval_updated_at: status.updated_at
    }, 200)
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

  // Web API: マニフェスト承認
  app.post("/api/manifests/:id/approve", requireAuth, async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)

    const result = await ManifestApprovalService(ctx, manifestId)

    if (!result) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    return c.json({}, 200)
  })

  // Web API: マニフェスト却下
  app.post("/api/manifests/:id/reject", requireAuth, async (c) => {
    const manifestId = c.req.param("id")
    const ctx = createApplicationContext(c)

    const result = await ManifestRejectionService(ctx, manifestId)

    if (!result) {
      return c.json({ error: "Manifest not found" }, 404)
    }

    return c.json({}, 200)
  })
}
