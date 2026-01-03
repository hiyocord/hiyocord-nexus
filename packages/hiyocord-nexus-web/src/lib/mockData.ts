import type { ManifestSummary, Manifest_V1 } from './types';

// モック用マニフェスト一覧
export const mockManifestSummaries: ManifestSummary[] = [
  {
    id: 'example-service-1',
    name: 'Example Service 1',
    icon_url: 'https://via.placeholder.com/64',
    description: 'サンプルのサービスワーカー1です。グローバルコマンドとギルド別コマンドを提供します。',
    base_url: 'https://example-service-1.workers.dev',
    command_count: {
      global: 3,
      guild: 2,
    },
    component_count: 5,
    modal_count: 2,
  },
  {
    id: 'example-service-2',
    name: 'Example Service 2',
    icon_url: null,
    description: '別のサンプルサービスワーカーです。シンプルなコマンドのみを提供します。',
    base_url: 'https://example-service-2.workers.dev',
    command_count: {
      global: 1,
      guild: 0,
    },
    component_count: 2,
    modal_count: 1,
  },
  {
    id: 'utility-bot',
    name: 'Utility Bot',
    icon_url: 'https://via.placeholder.com/64/0000FF/FFFFFF',
    description: '便利なユーティリティコマンドを提供するボットです。',
    base_url: 'https://utility-bot.workers.dev',
    command_count: {
      global: 5,
      guild: 3,
    },
    component_count: 10,
    modal_count: 4,
  },
];

// モック用マニフェスト詳細
export const mockManifestDetails: Record<string, Manifest_V1> = {
  'example-service-1': {
    version: '1.0.0',
    id: 'example-service-1',
    name: 'Example Service 1',
    icon_url: 'https://via.placeholder.com/64',
    description: 'サンプルのサービスワーカー1です。グローバルコマンドとギルド別コマンドを提供します。',
    base_url: 'https://example-service-1.workers.dev',
    application_commands: {
      global: [
        {
          name: 'hello',
          description: '挨拶をします',
          type: 1,
        },
        {
          name: 'ping',
          description: 'Pongを返します',
          type: 1,
        },
        {
          name: 'help',
          description: 'ヘルプを表示します',
          type: 1,
        },
      ],
      guild: [
        {
          name: 'admin',
          description: '管理コマンド',
          type: 1,
          guild_id: ['123456789012345678', '987654321098765432'],
        },
        {
          name: 'config',
          description: '設定コマンド',
          type: 1,
          guild_id: ['123456789012345678'],
        },
      ],
    },
    message_component_ids: ['btn_confirm', 'btn_cancel', 'select_menu_main', 'btn_delete', 'btn_edit'],
    modal_submit_ids: ['modal_input_form', 'modal_settings'],
    permissions: [
      {
        type: 'DISCORD_BOT',
      },
    ],
    signature_algorithm: 'ed25519',
    public_key: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  'example-service-2': {
    version: '1.0.0',
    id: 'example-service-2',
    name: 'Example Service 2',
    description: '別のサンプルサービスワーカーです。シンプルなコマンドのみを提供します。',
    base_url: 'https://example-service-2.workers.dev',
    application_commands: {
      global: [
        {
          name: 'echo',
          description: '入力した文字を返します',
          type: 1,
        },
      ],
      guild: [],
    },
    message_component_ids: ['btn_simple', 'select_option'],
    modal_submit_ids: ['modal_echo_form'],
    permissions: [
      {
        type: 'DISCORD_API_SCOPE',
        scopes: {
          '/channels/:channel_id/messages': ['POST'],
          '/channels/:channel_id/messages/:message_id': ['GET', 'DELETE'],
        },
      },
    ],
    signature_algorithm: 'ed25519',
    public_key: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  'utility-bot': {
    version: '1.0.0',
    id: 'utility-bot',
    name: 'Utility Bot',
    icon_url: 'https://via.placeholder.com/64/0000FF/FFFFFF',
    description: '便利なユーティリティコマンドを提供するボットです。',
    base_url: 'https://utility-bot.workers.dev',
    application_commands: {
      global: [
        {
          name: 'weather',
          description: '天気を取得します',
          type: 1,
        },
        {
          name: 'reminder',
          description: 'リマインダーを設定します',
          type: 1,
        },
        {
          name: 'poll',
          description: '投票を作成します',
          type: 1,
        },
        {
          name: 'translate',
          description: 'テキストを翻訳します',
          type: 1,
        },
        {
          name: 'calculator',
          description: '計算を実行します',
          type: 1,
        },
      ],
      guild: [
        {
          name: 'welcome_setup',
          description: 'ウェルカムメッセージを設定します',
          type: 1,
          guild_id: ['111111111111111111'],
        },
        {
          name: 'autorole',
          description: '自動ロールを設定します',
          type: 1,
          guild_id: ['111111111111111111'],
        },
        {
          name: 'log_channel',
          description: 'ログチャンネルを設定します',
          type: 1,
          guild_id: ['111111111111111111', '222222222222222222'],
        },
      ],
    },
    message_component_ids: [
      'poll_vote_1',
      'poll_vote_2',
      'poll_vote_3',
      'reminder_dismiss',
      'reminder_snooze',
      'translate_lang_select',
      'weather_location_select',
      'calc_number_pad',
      'calc_operator',
      'welcome_test',
    ],
    modal_submit_ids: ['reminder_form', 'poll_create_form', 'translate_text_form', 'welcome_message_form'],
    permissions: [
      {
        type: 'DISCORD_BOT',
      },
    ],
    signature_algorithm: 'ed25519',
    public_key: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  },
};
