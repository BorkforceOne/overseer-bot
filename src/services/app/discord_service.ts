import { Client } from "discord.js";
import { config } from "../../utils/config";

export class DiscordService {
  private client = new Client();

  async start() {
    this.client.login(config.discordApiKey);
  }

  getClient() {
    return this.client;
  }
}