import { Client } from 'discord.js';

import { DiscordService } from '../../services/discord_service';
import { Hook } from '../../utils/hook';
const npmPackage = require('../../../package.json');

export class VersionHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on("ready", () => {
      console.log(`Running version (${npmPackage.version} - ${process.env.COMMIT_SHA})`);
    });

    client.on("message", (msg) => {
      if (msg.content === "/version") {
        msg.reply(`I'm running version (${npmPackage.version} - ${process.env.COMMIT_SHA})`);
      }
    });
  }
}
