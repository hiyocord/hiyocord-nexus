export interface ManifestSummary {
    id: string;
    name: string;
    icon_url: string | null;
    description: string;
    base_url: string;
    command_count: {
        global: number;
        guild: number;
    };
    component_count: number;
    modal_count: number;
}
export interface DiscordCommand {
    name: string;
    description: string;
    type: number;
    options?: unknown[];
}
export interface GuildCommand extends DiscordCommand {
    guild_id: string[];
}
export interface Permission {
    type: 'DISCORD_BOT' | 'DISCORD_API_SCOPE';
    scopes?: Record<string, string[]>;
}
export interface Manifest_V1 {
    version: string;
    id: string;
    name: string;
    icon_url?: string | null;
    description: string;
    base_url: string;
    application_commands: {
        global: DiscordCommand[];
        guild: GuildCommand[];
    };
    message_component_ids: string[];
    modal_submit_ids: string[];
    permissions: Permission[];
    signature_algorithm: 'ed25519' | 'ecdsa-p256' | 'rsa-pss-2048';
    public_key: string;
}
//# sourceMappingURL=types.d.ts.map