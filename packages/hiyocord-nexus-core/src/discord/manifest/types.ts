import type { components } from "@hiyocord/hiyocord-nexus-types";

/**
 * Nexus Manifest for registering microservices
 */
export type NexusManifest = components["schemas"]["Manifest_V1"];

/**
 * Options for creating a Nexus manifest
 */
export interface CreateManifestOptions {
  /**
   * Unique identifier for the application
   * @example "my-discord-bot"
   */
  id: string;

  /**
   * Name of the application
   */
  name: string;

  /**
   * Base URL for the application
   */
  baseUrl: string;

  /**
   * Optional icon URL
   */
  iconUrl?: string | undefined;

  /**
   * Optional description
   */
  description: string;

  /**
   * Permissions required by the application
   */
  permissions?: components["schemas"]["Permission"][];

  /**
   * Message component custom IDs handled by this application
   */
  messageComponentIds?: string[];

  /**
   * Modal submit custom IDs handled by this application
   */
  modalSubmitIds?: string[];
}
