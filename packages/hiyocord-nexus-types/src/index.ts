export type * from './types';
export type { APIInteraction } from "discord-api-types/v10";


import { components } from './types';

export type ManifestAnyVersion = components["schemas"]["ManifestAnyVersion"]
export type ManifestLatestVersion = components["schemas"]["ManifestLatestVersion"]
export type DiscordCommand = components["schemas"]["DiscordCommand"]
