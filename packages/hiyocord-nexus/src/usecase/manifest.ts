import type { DiscordCommand, ManifestLatestVersion } from '@hiyocord/hiyocord-nexus-types'
import { ApplicationContext } from '../application-context'
import { ManifestStore } from '../infrastructure/manifest'
import { ApprovalStore } from '../infrastructure/approval'

const getCommandObject = (manifests: ManifestLatestVersion[]) => {
  const guildCmdManifest = manifests.map(it => it.application_commands.guild)
      .filter(it => it.length !== 0)
      .flat()

  const guildId = Array.from(new Set(guildCmdManifest.map(it => it.guild_id).flat()))
  const guildCmd = guildId.reduce((pre, it) => {
    const commands = guildCmdManifest.filter(cmd => cmd.guild_id.includes(it))
    commands.map(cmd => {
      const { guild_id, ...request} = cmd
      return request
    })
    return {...pre, [it]: commands}
  }, {} as {[k: string]: DiscordCommand[]})

  const globalCmd = manifests.map(it => it.application_commands.global)
      .filter(it => it.length !== 0)
      .flat()

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
  })

  if (res.ok) {
    console.log(`✅ Registered ${commands.length} command(s) to ${url}`)
  } else {
    const text = await res.text()
    console.error(`❌ Failed to register commands ${JSON.stringify(commands)} (${url}): ${res.status} ${text}`)
  }
}

const deleteDiscordCommands = async (
  ctx: ApplicationContext,
  global: DiscordCommand[],
  guild: {[k: string]: DiscordCommand[]}
) => {
  const baseUrl = `https://discord.com/api/v10/applications/${ctx.discord.getApplicationId()}`

  // グローバルコマンド削除
  await registerCommandSet(`${baseUrl}/commands`, [], ctx.discord.getToken())

  // ギルドコマンド削除
  const req = Object.keys(guild).map(k =>
    registerCommandSet(`${baseUrl}/guilds/${k}/commands`, [], ctx.discord.getToken())
  )
  await Promise.all(req)
}

const hasPermissionsChanged = (oldManifest: ManifestLatestVersion, newManifest: ManifestLatestVersion): boolean => {
  const oldPerms = JSON.stringify(oldManifest.permissions)
  const newPerms = JSON.stringify(newManifest.permissions)
  const changed = oldPerms !== newPerms

  if (changed) {
    console.log(`Permissions changed for manifest ${newManifest.id}`)
    console.log('Old:', oldPerms)
    console.log('New:', newPerms)
  }

  return changed
}

export const ManifestRegisterService = async (ctx: ApplicationContext, manifest: ManifestLatestVersion) => {
  const manifestStore = ManifestStore(ctx)
  const approvalStore = ApprovalStore(ctx)

  // 既存Manifestが存在するかチェック
  const existing = await manifestStore.findById(manifest.id)
  const currentApprovalStatus = existing ? await approvalStore.get(manifest.id) : null

  if (existing) {
    // permissionsの変更チェック
    const permissionsChanged = hasPermissionsChanged(existing, manifest)

    // 既存manifestとインデックスを削除
    await manifestStore.remove(manifest.id)

    if (permissionsChanged) {
      // permissionsに変更がある場合: Discordコマンドを削除し、pendingにリセット
      const { global, guild } = getCommandObject([existing])
      await deleteDiscordCommands(ctx, global, guild)

      await manifestStore.save(manifest)
      await approvalStore.set(manifest.id, {
        status: 'pending',
        updated_at: Date.now()
      })

      return async () => {
        // 承認後に実行
      }
    } else {
      // permissionsに変更がない場合: 承認状態を維持
      await manifestStore.save(manifest)

      // 承認状態が存在しない場合はapprovedとして保存（後方互換性）
      const statusToSave = currentApprovalStatus ?? {
        status: 'approved' as const,
        updated_at: Date.now()
      }

      await approvalStore.set(manifest.id, {
        ...statusToSave,
        updated_at: Date.now()
      })

      // 既に承認済みの場合はDiscordコマンドを再登録
      if (statusToSave.status === 'approved') {
        return async () => {
          const baseUrl = `https://discord.com/api/v10/applications/${ctx.discord.getApplicationId()}`
          const manifests = await manifestStore.findAll()
          const { global, guild } = getCommandObject(manifests)

          await registerCommandSet(`${baseUrl}/commands`, global, ctx.discord.getToken())
          const req = Object.keys(guild).map(k =>
            registerCommandSet(`${baseUrl}/guilds/${k}/commands`, guild[k]!, ctx.discord.getToken())
          )
          await Promise.all(req)
        }
      } else {
        return async () => {
          // rejected or pending: 何もしない
        }
      }
    }
  } else {
    // 新規登録の場合
    await manifestStore.save(manifest)
    await approvalStore.set(manifest.id, {
      status: 'pending',
      updated_at: Date.now()
    })

    return async () => {
      // 承認後に実行
    }
  }
}

export const ManifestDeleteService = async (ctx: ApplicationContext, manifestId: string) => {
  const manifestStore = ManifestStore(ctx)
  const approvalStore = ApprovalStore(ctx)

  const deleted = await manifestStore.remove(manifestId)
  if (!deleted) {
    return null
  }

  // 承認状態も削除
  await approvalStore.remove(manifestId)

  // Discordコマンド再登録を非同期実行
  return async () => {
    const baseUrl = `https://discord.com/api/v10/applications/${ctx.discord.getApplicationId()}`
    const manifests = await manifestStore.findAll()
    const { global, guild } = getCommandObject(manifests)

    // グローバルコマンド登録
    await registerCommandSet(`${baseUrl}/commands`, global, ctx.discord.getToken())

    // ギルドコマンド登録
    const req = Object.keys(guild).map(k =>
      registerCommandSet(`${baseUrl}/guilds/${k}/commands`, guild[k]!, ctx.discord.getToken())
    )
    await Promise.all(req)
  }
}
