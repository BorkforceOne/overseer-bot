import { Client } from 'discord.js';

import { DiscordService } from '../../services/discord_service';
import { Hook } from '../../utils/hook';

export class VersionHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on("ready", () => {
      console.log(`Running version (${process.env.npm_package_version} - ${process.env.SOURCE_COMMIT})`);
    });

    client.on("message", (msg) => {
      if (msg.content === "/version") {
        msg.reply(`I'm running version (${process.env.npm_package_version} - ${process.env.SOURCE_COMMIT})`);
      }
    });
  }
}
