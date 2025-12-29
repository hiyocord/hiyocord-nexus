import { describe, it, expect } from 'vitest';
import { ManifestResolver } from './manifest';
import { Manifest } from '@hiyocord/hiyocord-nexus-types';
import { InteractionType, ApplicationCommandType } from 'discord-api-types/v10';

describe('ManifestResolver', () => {
  const createBasicManifest = (id: string): Manifest => ({
    version: '1.0.0',
    id,
    name: `Service ${id}`,
    base_url: `https://${id}.workers.dev`,
    icon_url: null,
    description: 'Test service',
    signature_algorithm: 'ed25519',
    public_key: 'test-public-key',
    application_commands: {
      global: [],
      guild: [],
    },
    message_component_ids: [],
    modal_submit_ids: [],
    permissions: [],
  });

  describe('byId', () => {
    it('should find manifest by id', () => {
      const manifests = [
        createBasicManifest('service-1'),
        createBasicManifest('service-2'),
      ];

      const resolver = ManifestResolver(manifests);
      const result = resolver.byId('service-2');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('service-2');
    });

    it('should return null if manifest not found', () => {
      const manifests = [createBasicManifest('service-1')];

      const resolver = ManifestResolver(manifests);
      const result = resolver.byId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('byInteraction - Application Commands', () => {
    it('should find manifest for global command', () => {
      const manifest = createBasicManifest('test-service');
      manifest.application_commands.global = [
        {
          name: 'test-command',
          description: 'Test command',
          type: ApplicationCommandType.ChatInput,
        },
      ];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.ApplicationCommand,
        data: {
          name: 'test-command',
          type: ApplicationCommandType.ChatInput,
        },
        guild: undefined,
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should find manifest for guild command', () => {
      const manifest = createBasicManifest('test-service');
      manifest.application_commands.guild = [
        {
          name: 'guild-command',
          description: 'Guild command',
          type: ApplicationCommandType.ChatInput,
          guild_id: ['123456789'],
        },
      ];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.ApplicationCommand,
        data: {
          name: 'guild-command',
          type: ApplicationCommandType.ChatInput,
        },
        guild: {
          id: '123456789',
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should prioritize guild command over global command', () => {
      const globalManifest = createBasicManifest('global-service');
      globalManifest.application_commands.global = [
        {
          name: 'shared-command',
          description: 'Global command',
          type: ApplicationCommandType.ChatInput,
        },
      ];

      const guildManifest = createBasicManifest('guild-service');
      guildManifest.application_commands.guild = [
        {
          name: 'shared-command',
          description: 'Guild command',
          type: ApplicationCommandType.ChatInput,
          guild_id: ['123456789'],
        },
      ];

      const resolver = ManifestResolver([globalManifest, guildManifest]);
      const interaction: any = {
        type: InteractionType.ApplicationCommand,
        data: {
          name: 'shared-command',
          type: ApplicationCommandType.ChatInput,
        },
        guild: {
          id: '123456789',
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('guild-service');
    });
  });

  describe('byInteraction - Message Components', () => {
    it('should find manifest for button interaction', () => {
      const manifest = createBasicManifest('test-service');
      manifest.message_component_ids = ['confirm-button', 'cancel-button'];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'confirm-button',
          component_type: 2, // Button
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should find manifest for select menu interaction', () => {
      const manifest = createBasicManifest('test-service');
      manifest.message_component_ids = ['role-select', 'channel-select'];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'role-select',
          component_type: 3, // Select menu
          values: ['role1'],
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should return null if custom_id not registered', () => {
      const manifest = createBasicManifest('test-service');
      manifest.message_component_ids = ['known-button'];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'unknown-button',
          component_type: 2,
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).toBeUndefined();
    });

    it('should handle multiple manifests with different custom_ids', () => {
      const manifest1 = createBasicManifest('service-1');
      manifest1.message_component_ids = ['button-a', 'button-b'];

      const manifest2 = createBasicManifest('service-2');
      manifest2.message_component_ids = ['button-c', 'button-d'];

      const resolver = ManifestResolver([manifest1, manifest2]);

      const interaction1: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'button-b', component_type: 2 },
      };

      const interaction2: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'button-d', component_type: 2 },
      };

      expect(resolver.byInteraction(interaction1)?.id).toBe('service-1');
      expect(resolver.byInteraction(interaction2)?.id).toBe('service-2');
    });
  });

  describe('byInteraction - Modal Submit', () => {
    it('should find manifest for modal submit', () => {
      const manifest = createBasicManifest('test-service');
      manifest.modal_submit_ids = ['feedback-modal', 'settings-modal'];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.ModalSubmit,
        data: {
          custom_id: 'feedback-modal',
          components: [],
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should return null if modal custom_id not registered', () => {
      const manifest = createBasicManifest('test-service');
      manifest.modal_submit_ids = ['known-modal'];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.ModalSubmit,
        data: {
          custom_id: 'unknown-modal',
          components: [],
        },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).toBeUndefined();
    });

    it('should handle multiple manifests with different modal_ids', () => {
      const manifest1 = createBasicManifest('service-1');
      manifest1.modal_submit_ids = ['modal-a', 'modal-b'];

      const manifest2 = createBasicManifest('service-2');
      manifest2.modal_submit_ids = ['modal-c', 'modal-d'];

      const resolver = ManifestResolver([manifest1, manifest2]);

      const interaction1: any = {
        type: InteractionType.ModalSubmit,
        data: { custom_id: 'modal-a', components: [] },
      };

      const interaction2: any = {
        type: InteractionType.ModalSubmit,
        data: { custom_id: 'modal-d', components: [] },
      };

      expect(resolver.byInteraction(interaction1)?.id).toBe('service-1');
      expect(resolver.byInteraction(interaction2)?.id).toBe('service-2');
    });
  });

  describe('edge cases', () => {
    it('should handle manifest with empty message_component_ids', () => {
      const manifest = createBasicManifest('test-service');
      manifest.message_component_ids = [];

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'any-button', component_type: 2 },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).toBeUndefined();
    });

    it('should handle manifest with undefined message_component_ids', () => {
      const manifest = createBasicManifest('test-service');
      delete (manifest as any).message_component_ids;

      const resolver = ManifestResolver([manifest]);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'any-button', component_type: 2 },
      };

      const result = resolver.byInteraction(interaction);

      expect(result).toBeUndefined();
    });

    it('should throw error for unknown interaction type', () => {
      const manifest = createBasicManifest('test-service');
      const resolver = ManifestResolver([manifest]);

      const interaction: any = {
        type: 999, // Unknown type
        data: {},
      };

      expect(() => resolver.byInteraction(interaction)).toThrow('unknown interaction type');
    });
  });
});
