import type { ManifestLatestVersion, DiscordCommand } from '@hiyocord/hiyocord-nexus-types'
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

const deleteCommandSet = async (
  url: string,
  token: string
) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([]),
  })

  if (res.ok) {
    console.log(`✅ Deleted commands from ${url}`)
  } else {
    const text = await res.text()
    console.error(`❌ Failed to delete commands (${url}): ${res.status} ${text}`)
  }
}

export const ManifestApprovalService = async (ctx: ApplicationContext, manifestId: string) => {
  const manifestStore = ManifestStore(ctx)
  const approvalStore = ApprovalStore(ctx)

  // manifestの存在確認
  const manifest = await manifestStore.findById(manifestId)
  if (!manifest) {
    return null
  }

  // 承認状態をapprovedに更新
  await approvalStore.set(manifestId, {
    status: 'approved',
    updated_at: Date.now()
  })

  // Discordコマンド登録を実行
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

  return true
}

export const ManifestRejectionService = async (ctx: ApplicationContext, manifestId: string) => {
  const manifestStore = ManifestStore(ctx)
  const approvalStore = ApprovalStore(ctx)

  // manifestの存在確認
  const manifest = await manifestStore.findById(manifestId)
  if (!manifest) {
    return null
  }

  // 承認状態をrejectedに更新
  await approvalStore.set(manifestId, {
    status: 'rejected',
    updated_at: Date.now()
  })

  // 既存のDiscordコマンドを削除
  const baseUrl = `https://discord.com/api/v10/applications/${ctx.discord.getApplicationId()}`
  const manifests = await manifestStore.findAll()
  const { global, guild } = getCommandObject(manifests)

  // グローバルコマンド削除
  await deleteCommandSet(`${baseUrl}/commands`, ctx.discord.getToken())

  // ギルドコマンド削除
  const req = Object.keys(guild).map(k =>
    deleteCommandSet(`${baseUrl}/guilds/${k}/commands`, ctx.discord.getToken())
  )
  await Promise.all(req)

  return true
}
