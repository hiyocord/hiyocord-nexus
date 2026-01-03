import type { APIInteraction, ManifestAnyVersion, ManifestLatestVersion } from '@hiyocord/hiyocord-nexus-types'
import {
  APIApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
  InteractionType
} from 'discord-api-types/v10'
import { migrateManifest } from './migrate'
import { ApplicationContext } from '../../application-context'

type ApplicationCmdInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction

export const ManifestStore = (ctx: ApplicationContext) => {
  const kv = ctx.getManifestKv()

  const findById = async (id: string): Promise<ManifestLatestVersion | null> => {
    const manifestJson = await kv.get(`manifest:${id}`, "json")
    if (!manifestJson) {
      return null
    }
    return migrateManifest([manifestJson as ManifestAnyVersion])[0] ?? null
  }

  const findByInteraction = async (interaction: APIInteraction): Promise<ManifestLatestVersion | null> => {
    let manifestId: string | null = null

    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
      case InteractionType.ApplicationCommandAutocomplete: {
        const cmdName = (interaction as ApplicationCmdInteraction).data.name

        // ギルドコマンドを優先検索
        if (interaction.guild) {
          manifestId = await kv.get(`cmd:guild:${interaction.guild.id}:${cmdName}`, "text")
        }

        // グローバルコマンドにフォールバック
        if (!manifestId) {
          manifestId = await kv.get(`cmd:global:${cmdName}`, "text")
        }
        break
      }

      case InteractionType.MessageComponent: {
        manifestId = await kv.get(`component:${interaction.data.custom_id}`, "text")
        break
      }

      case InteractionType.ModalSubmit: {
        manifestId = await kv.get(`modal:${interaction.data.custom_id}`, "text")
        break
      }

      default:
        throw new Error("unknown interaction type")
    }

    if (!manifestId) {
      return null
    }

    return await findById(manifestId)
  }

  const findAll = async (): Promise<ManifestLatestVersion[]> => {
    const manifestIds = await kv.get("manifests", "json") as string[] | null
    if (!manifestIds) {
      return []
    }

    const manifests: ManifestLatestVersion[] = []
    for (const id of manifestIds) {
      const manifest = await findById(id)
      if (manifest) {
        manifests.push(manifest)
      }
    }
    return manifests
  }

  const save = async (manifest: ManifestLatestVersion) => {
    const migrated = migrateManifest([manifest])[0]
    if (!migrated) {
      throw new Error('Manifest migration failed')
    }

    // 操作順序: Manifest本体→インデックス
    // 1. Manifest本体を保存
    await kv.put(`manifest:${migrated.id}`, JSON.stringify(migrated))

    // 2. グローバルコマンドインデックスを更新
    for (const cmd of migrated.application_commands.global) {
      await kv.put(`cmd:global:${cmd.name}`, migrated.id)
    }

    // 3. ギルドコマンドインデックスを更新
    for (const cmd of migrated.application_commands.guild) {
      for (const guildId of cmd.guild_id) {
        await kv.put(`cmd:guild:${guildId}:${cmd.name}`, migrated.id)
      }
    }

    // 4. Message Componentインデックスを更新
    for (const customId of migrated.message_component_ids ?? []) {
      await kv.put(`component:${customId}`, migrated.id)
    }

    // 5. Modal Submitインデックスを更新
    for (const customId of migrated.modal_submit_ids ?? []) {
      await kv.put(`modal:${customId}`, migrated.id)
    }

    // 6. Manifestリストを更新
    const manifestIds = await kv.get("manifests", "json") as string[] | null ?? []
    if (!manifestIds.includes(migrated.id)) {
      manifestIds.push(migrated.id)
      await kv.put("manifests", JSON.stringify(manifestIds))
    }
  }

  const remove = async (id: string) => {
    // 1. 既存Manifestを取得
    const manifest = await findById(id)
    if (!manifest) {
      return false
    }

    // 操作順序: インデックス削除→Manifest削除
    // 2. グローバルコマンドインデックスを削除
    for (const cmd of manifest.application_commands.global) {
      await kv.delete(`cmd:global:${cmd.name}`)
    }

    // 3. ギルドコマンドインデックスを削除
    for (const cmd of manifest.application_commands.guild) {
      for (const guildId of cmd.guild_id) {
        await kv.delete(`cmd:guild:${guildId}:${cmd.name}`)
      }
    }

    // 4. Message Componentインデックスを削除
    for (const customId of manifest.message_component_ids ?? []) {
      await kv.delete(`component:${customId}`)
    }

    // 5. Modal Submitインデックスを削除
    for (const customId of manifest.modal_submit_ids ?? []) {
      await kv.delete(`modal:${customId}`)
    }

    // 6. Manifest本体を削除
    await kv.delete(`manifest:${id}`)

    // 7. Manifestリストから削除
    const manifestIds = await kv.get("manifests", "json") as string[] | null ?? []
    const filteredIds = manifestIds.filter(manifestId => manifestId !== id)
    await kv.put("manifests", JSON.stringify(filteredIds))

    return true
  }

  return {
    findById,
    findByInteraction,
    findAll,
    save,
    remove
  }
}
