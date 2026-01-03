import type { DiscordCommand, ManifestLatestVersion } from '@hiyocord/hiyocord-nexus-types'
import { ApplicationContext } from '../application-context'
import { ManifestStore } from '../infrastructure/manifest'

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

export const ManifestRegisterService = async (ctx: ApplicationContext, manifest: ManifestLatestVersion) => {
  const manifestStore = ManifestStore(ctx)

  // 既存Manifestが存在する場合は削除（更新の場合）
  const existing = await manifestStore.findById(manifest.id)
  if (existing) {
    await manifestStore.remove(manifest.id)
  }

  // 新しいManifestを保存（インデックス含む）
  await manifestStore.save(manifest)

  // Discordコマンド登録を非同期実行
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

export const ManifestDeleteService = async (ctx: ApplicationContext, manifestId: string) => {
  const manifestStore = ManifestStore(ctx)

  const deleted = await manifestStore.remove(manifestId)
  if (!deleted) {
    return null
  }

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
