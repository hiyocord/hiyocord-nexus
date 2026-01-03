import type { APIInteraction, Manifest } from '@hiyocord/hiyocord-nexus-types'
import {
  APIApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
  InteractionType
} from 'discord-api-types/v10'
import { ApplicationContext } from '../application-context'

type ApplicationCmdInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction

export const ManifestResolver = (ctx: ApplicationContext) => {
  const kv = ctx.getManifestKv()

  const byId = async (id: string): Promise<Manifest | null> => {
    const manifestJson = await kv.get(`manifest:${id}`, "json")
    return manifestJson as Manifest | null
  }

  const byInteraction = async (interaction: APIInteraction): Promise<Manifest | null> => {
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

    // Manifest本体を取得
    return await byId(manifestId)
  }

  return {
    byId,
    byInteraction
  }
}



