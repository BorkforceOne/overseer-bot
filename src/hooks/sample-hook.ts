import { Hook } from '../utils/hook';
import { Client } from 'discord.js';
import { DiscordService } from '../services/app/discord_service';

export class SampleHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on("ready", () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("message", (msg) => {
      if (msg.content === "ping") {
        msg.reply("pong");
      }
    });
  }
}
