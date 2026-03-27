import type {
  InteractionHandlerRegistry,
  ApplicationCommandHandler,
  DeferredApplicationCommandHandler,
} from "@hiyocord/discord-interaction-client";
import type { NexusManifest, CreateManifestOptions } from "./types";
import type { ManifestLatestVersion } from "@hiyocord/hiyocord-nexus-types";
import { InteractionType } from "discord-api-types/v10";

/**
 * Create a Nexus manifest from an InteractionHandlerRegistry
 *
 * @param registry - The InteractionHandlerRegistry containing command handlers
 * @param options - Configuration options for the manifest
 * @returns A NexusManifest for registering with Hiyocord Nexus
 *
 * @example
 * ```typescript
 * const registry = new DefaultInteractionHandlerRegistry();
 * registry.register(InteractionType.ApplicationCommand, myCommandHandler);
 *
 * const manifest = createManifest(registry, {
 *   id: "my-discord-bot",
 *   name: "My Discord Bot",
 *   baseUrl: "https://my-bot.example.com",
 *   permissions: ["DISCORD_BOT"]
 * });
 * ```
 */
export function createManifest(
  registry: InteractionHandlerRegistry,
  options: CreateManifestOptions,
): NexusManifest {
  // Get all ApplicationCommand handlers from registry
  const handlers: (ApplicationCommandHandler | DeferredApplicationCommandHandler)[] = registry.get(InteractionType.ApplicationCommand);

  const getOptions = (it: ApplicationCommandHandler | DeferredApplicationCommandHandler) => {
    if(!it.options) {
      return null;
    }
    return it.options.map(opt => ({
        type: opt.type,
        name: opt.name,
        name_localizations: null,
        description: opt.description,
        description_localizations: null,
        autocomplete: opt.autocomplete ?? null,
        min_length: opt.min_length ?? null,
        max_length: opt.max_length ?? null,
        required: opt.required ?? null
      }))
  }

  // Convert handlers to Nexus command definitions
  const globalCommands = handlers.filter(it => it.guildIds?.length == 0).map(it => {
    return {
      name: it.name,
      description: it.description,
      options: getOptions(it)
    } satisfies ManifestLatestVersion["application_commands"]["global"][number]
  });
  const guildCommands = handlers.filter(it => it.guildIds?.length??0 > 0).map(
    it => {
      return {
        name: it.name,
        description: it.description,
        guild_id: it.guildIds!,
        options: getOptions(it)
      } satisfies ManifestLatestVersion["application_commands"]["guild"][number];
    },
  );

  return {
    version: "1.0.0",
    id: options.id,
    name: options.name,
    base_url: options.baseUrl,
    icon_url: options.iconUrl??null,
    description: options.description,
    signature_algorithm: options.signatureAlgorithm,
    public_key: options.publicKey,
    application_commands: {
      global: globalCommands,
      guild: guildCommands,
    },
    message_component_ids: options.messageComponentIds ?? [],
    modal_submit_ids: options.modalSubmitIds ?? [],
    permissions: options.permissions ?? [],
  };
}
