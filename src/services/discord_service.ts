import { Client } from "discord.js";

export class DiscordService {
  private client = new Client();

  async start() {
    this.client.login(process.env.API_KEY);
  }

  getClient() {
    return this.client;
  }
}