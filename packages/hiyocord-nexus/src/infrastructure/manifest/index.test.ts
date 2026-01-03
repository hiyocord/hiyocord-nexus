import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManifestStore } from './index';
import { Manifest } from '@hiyocord/hiyocord-nexus-types';
import { InteractionType, ApplicationCommandType } from 'discord-api-types/v10';
import type { ApplicationContext } from '../../application-context';
import type { KVNamespace } from '@cloudflare/workers-types';

describe('ManifestStore', () => {
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

  const createMockKV = (): KVNamespace => {
    const storage = new Map<string, string>();
    return {
      get: vi.fn(async (key: string, type?: string) => {
        const value = storage.get(key);
        if (!value) return null;
        if (type === 'json') return JSON.parse(value);
        return value;
      }),
      put: vi.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        storage.delete(key);
      }),
      list: vi.fn(),
      getWithMetadata: vi.fn(),
      setStorage: (key: string, value: any) => {
        storage.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      },
    } as any;
  };

  const createMockContext = (kv: KVNamespace): ApplicationContext => ({
    getManifestKv: () => kv,
    getNexusPrivateKey: () => 'test-key',
    getNexusPublicKey: () => 'test-pub-key',
    getNexusSignatureAlgorithm: () => 'ed25519',
    discord: {
      getApplicationId: () => 'test-app-id',
      getToken: () => 'test-token',
      getClientSecret: () => 'test-secret',
      getPublicKey: () => 'test-pub-key',
    },
  });

  describe('byId', () => {
    it('should find manifest by id', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('service-1');
      kv.setStorage('manifest:service-1', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const result = await store.findById('service-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('service-1');
    });

    it('should return null if manifest not found', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const result = await store.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('byInteraction - Application Commands', () => {
    it('should find manifest for global command', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('test-service');
      manifest.application_commands.global = [
        {
          name: 'test-command',
          description: 'Test command',
          type: ApplicationCommandType.ChatInput,
        },
      ];

      kv.setStorage('cmd:global:test-command', 'test-service');
      kv.setStorage('manifest:test-service', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.ApplicationCommand,
        data: {
          name: 'test-command',
          type: ApplicationCommandType.ChatInput,
        },
        guild: undefined,
      };

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should find manifest for guild command', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('test-service');
      manifest.application_commands.guild = [
        {
          name: 'guild-command',
          description: 'Guild command',
          type: ApplicationCommandType.ChatInput,
          guild_id: ['123456789'],
        },
      ];

      kv.setStorage('cmd:guild:123456789:guild-command', 'test-service');
      kv.setStorage('manifest:test-service', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
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

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should prioritize guild command over global command', async () => {
      const kv = createMockKV();
      const globalManifest = createBasicManifest('global-service');
      const guildManifest = createBasicManifest('guild-service');

      kv.setStorage('cmd:global:shared-command', 'global-service');
      kv.setStorage('cmd:guild:123456789:shared-command', 'guild-service');
      kv.setStorage('manifest:global-service', globalManifest);
      kv.setStorage('manifest:guild-service', guildManifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
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

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('guild-service');
    });
  });

  describe('byInteraction - Message Components', () => {
    it('should find manifest for button interaction', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('test-service');

      kv.setStorage('component:confirm-button', 'test-service');
      kv.setStorage('manifest:test-service', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'confirm-button',
          component_type: 2,
        },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should find manifest for select menu interaction', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('test-service');

      kv.setStorage('component:role-select', 'test-service');
      kv.setStorage('manifest:test-service', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'role-select',
          component_type: 3,
          values: ['role1'],
        },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should return null if custom_id not registered', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: 'unknown-button',
          component_type: 2,
        },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).toBeNull();
    });

    it('should handle multiple manifests with different custom_ids', async () => {
      const kv = createMockKV();
      const manifest1 = createBasicManifest('service-1');
      const manifest2 = createBasicManifest('service-2');

      kv.setStorage('component:button-b', 'service-1');
      kv.setStorage('component:button-d', 'service-2');
      kv.setStorage('manifest:service-1', manifest1);
      kv.setStorage('manifest:service-2', manifest2);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);

      const interaction1: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'button-b', component_type: 2 },
      };

      const interaction2: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'button-d', component_type: 2 },
      };

      expect((await store.findByInteraction(interaction1))?.id).toBe('service-1');
      expect((await store.findByInteraction(interaction2))?.id).toBe('service-2');
    });
  });

  describe('byInteraction - Modal Submit', () => {
    it('should find manifest for modal submit', async () => {
      const kv = createMockKV();
      const manifest = createBasicManifest('test-service');

      kv.setStorage('modal:feedback-modal', 'test-service');
      kv.setStorage('manifest:test-service', manifest);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.ModalSubmit,
        data: {
          custom_id: 'feedback-modal',
          components: [],
        },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-service');
    });

    it('should return null if modal custom_id not registered', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.ModalSubmit,
        data: {
          custom_id: 'unknown-modal',
          components: [],
        },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).toBeNull();
    });

    it('should handle multiple manifests with different modal_ids', async () => {
      const kv = createMockKV();
      const manifest1 = createBasicManifest('service-1');
      const manifest2 = createBasicManifest('service-2');

      kv.setStorage('modal:modal-a', 'service-1');
      kv.setStorage('modal:modal-d', 'service-2');
      kv.setStorage('manifest:service-1', manifest1);
      kv.setStorage('manifest:service-2', manifest2);

      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);

      const interaction1: any = {
        type: InteractionType.ModalSubmit,
        data: { custom_id: 'modal-a', components: [] },
      };

      const interaction2: any = {
        type: InteractionType.ModalSubmit,
        data: { custom_id: 'modal-d', components: [] },
      };

      expect((await store.findByInteraction(interaction1))?.id).toBe('service-1');
      expect((await store.findByInteraction(interaction2))?.id).toBe('service-2');
    });
  });

  describe('edge cases', () => {
    it('should handle manifest with empty message_component_ids', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'any-button', component_type: 2 },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).toBeNull();
    });

    it('should handle manifest with undefined message_component_ids', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);
      const interaction: any = {
        type: InteractionType.MessageComponent,
        data: { custom_id: 'any-button', component_type: 2 },
      };

      const result = await store.findByInteraction(interaction);

      expect(result).toBeNull();
    });

    it('should throw error for unknown interaction type', async () => {
      const kv = createMockKV();
      const ctx = createMockContext(kv);
      const store = ManifestStore(ctx);

      const interaction: any = {
        type: 999,
        data: {},
      };

      await expect(store.findByInteraction(interaction)).rejects.toThrow('unknown interaction type');
    });
  });
});
