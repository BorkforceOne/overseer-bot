import { Client } from 'discord.js';

/**
 * Hook optional life-cycle functions.
 */
export abstract class Hook {
  /**
   * Current client object
   */
  protected client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Called during hook initialization.
   * @virtual
   */
  public init() {
    return;
  }
}
