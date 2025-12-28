import type { APIInteraction, components, Manifest } from '@hiyocord/hiyocord-nexus-types'
import {
  APIApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  InteractionType
} from 'discord-api-types/v10'

type ApplicationCmdInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction

const getApplicationCmdManifest = (interaction: ApplicationCmdInteraction, manifests: Manifest[]) => {
  if(interaction.guild) { // guild command
    for(const it of manifests) {
      const command = it.application_commands.guild
          .filter(cmd => cmd.guild_id.includes(interaction.guild?.id!))
          .find(cmd => interaction.data.name === cmd.name)
      if(command) {
        return it;
      }
    }
  }

  // global command
  for(const it of manifests) {
    const command = it.application_commands.global.find(cmd => interaction.data.name === cmd.name);
    if(command) {
        return it;
    }
  }

  return null;
}

const getMessageComponentManifest = (interaction: APIMessageComponentInteraction, manifests: Manifest[]) => {
  return manifests.find(it => (it.message_component_ids??[]).includes(interaction.data.custom_id))
}

const getModalSubmitManifest = (interaction: APIModalSubmitInteraction, manifests: Manifest[]) => {
  return manifests.find(it => (it.modal_submit_ids??[]).includes(interaction.data.custom_id))
}

export const ManifestResolver = (manifests: Manifest[]) => {
  const byId = (id: string) => {
    return manifests.find(it => it.id === id) ?? null
  }

  const byInteraction = (interaction: APIInteraction) => {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
      case InteractionType.ApplicationCommandAutocomplete:
        return getApplicationCmdManifest(interaction, manifests);
      case InteractionType.MessageComponent:
        return getMessageComponentManifest(interaction, manifests);
      case InteractionType.ModalSubmit:
        return getModalSubmitManifest(interaction, manifests);
      default:
        throw new Error("unknown interaction type");
    }
  }

  return {
    byId,
    byInteraction
  }
}



