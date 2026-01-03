import { Manifest } from '@hiyocord/hiyocord-nexus-types'
import { migrateManifest } from './migrate'
import { ApplicationContext } from '../../application-context'

export const ManifestStore = (ctx: ApplicationContext) => {
  const kv = ctx.getManifestKv()

  const findById = async (id: string): Promise<Manifest | null> => {
    const manifestJson = await kv.get(`manifest:${id}`, "json")
    if (!manifestJson) {
      return null
    }
    return migrateManifest([manifestJson as Manifest])[0] ?? null
  }

  const findAll = async (): Promise<Manifest[]> => {
    const manifestIds = await kv.get("manifests", "json") as string[] | null
    if (!manifestIds) {
      return []
    }

    const manifests: Manifest[] = []
    for (const id of manifestIds) {
      const manifest = await findById(id)
      if (manifest) {
        manifests.push(manifest)
      }
    }
    return manifests
  }

  const save = async (manifest: Manifest) => {
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
    findAll,
    save,
    remove
  }
}
