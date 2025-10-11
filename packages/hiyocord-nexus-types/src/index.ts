export type * from './types';
export type { APIInteraction } from "discord-api-types/v10";


import { components } from './types';

export type Manifest = components["schemas"]["Manifest"]
export type DiscordCommand = components["schemas"]["DiscordCommand"]
