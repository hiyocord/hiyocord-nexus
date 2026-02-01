import { Hono } from "hono"
import { HonoEnv } from "../../types"
import type { ManifestAnyVersion } from '@hiyocord/hiyocord-nexus-types'
import { createApplicationContext } from "../../application-context"
import { ManifestRegisterService, ManifestDeleteService } from "../../usecase/manifest"
import { ManifestApprovalService, ManifestRejectionService } from "../../usecase/manifest-approval"
import { ManifestStore } from "../../infrastructure/manifest"
import { ApprovalStore } from "../../infrastructure/approval"
import { requireAuth } from "../../middlewares/auth"
import { createValidator, schemaForType } from "../zod"
import { z } from 'zod'
import { g } from "vitest/dist/chunks/suite.d.BJWk38HB"
import { sValidator } from "@hono/standard-validator"


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

  const schama = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
    base_url: z.string(),
    application_commands: z.object({
      global: z.any(),
      guild: z.any(),
    }),
    message_component_ids: z.array(z.string()),
    modal_submit_ids: z.array(z.string()),
    permissions: z.any(),
    signature_algorithm: z.enum(["ed25519", "ecdsa-p256", "rsa-pss-2048"]),
    public_key: z.string(),
  }) satisfies z.ZodType<ManifestAnyVersion>

  // Service Worker API: マニフェスト登録
  app.post("/api/manifests", sValidator("json", schama), async (c) => {
    const manifest = c.req.valid("json")
    const ctx = createApplicationContext(c)

    const registerDiscordCommands = await ManifestRegisterService(ctx, manifest)

    // Discordコマンド登録を同期実行
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
