import { Manifest } from '@hiyocord/hiyocord-nexus-types'
import { migrateManifest } from './migrate'
import { ApplicationContext } from '../../application-context'

export const ManifestStore = (ctx: ApplicationContext) => {
  const kv = ctx.getManifestKv()

  const findAll = async () => {
    const manifests = await kv.get("manifests", "json") as Manifest[]
    return migrateManifest(manifests);
  }

  const save = async (manifest: Manifest) => {
    const manifests = (await findAll()).filter(it => it.id !== manifest.id)
    const migrated = migrateManifest([manifest])
    kv.put("manifests", JSON.stringify([...manifests, ...migrated]))
  }

  return {
    findAll,
    save
  }
}
