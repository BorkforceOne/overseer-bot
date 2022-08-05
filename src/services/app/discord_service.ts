import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "../../utils/config";

export class DiscordService {
  private client = new Client({
    partials: [Partials.Message, Partials.Reaction],
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessages,
    ]
  });

  async start() {
    this.client.login(config.discordApiKey);
  }

  getClient() {
    return this.client;
  }
}