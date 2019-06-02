import { Client } from 'discord.js';

import { ENABLED_HOOKS } from './enabled-hooks';
import { Hook } from './hook';

/**
 * Handles collecting and initializing all the hooks.
 */
export class Hooks {
  private client: Client;
  private registeredHooks: Hook[];

  constructor(client: Client) {
    this.client = client;
    this.registeredHooks = [];
  }

  public init() {
    const { client } = this;

    // Register
    for (const HookClass of ENABLED_HOOKS) {
      this.registeredHooks.push(new HookClass(client));
    }

    // Init
    for (const hook of this.registeredHooks) {
      hook.init();
    }
  }
}
