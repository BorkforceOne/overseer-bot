import { Hook } from '../../utils/hook';
import { Client, Message } from 'discord.js';
import { DiscordService } from '../../services/app/discord_service';
import { AnthropicService } from '../../services/app/anthropic_service';
import { N7M_PROMPT } from '../../utils/prompts';

export class N7MHook implements Hook {
  private readonly client: Client;
  private readonly prefix: string = '!n7m';

  constructor(
    private readonly discordService: DiscordService,
    private readonly anthropicService: AnthropicService
  ) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on('messageCreate', async (msg: Message) => {
      // Ignore messages from bots to prevent potential loops
      if (msg.author.bot) return;

      // Check if the message starts with the prefix
      if (msg.content.startsWith(this.prefix)) {
        await this.handleN7MCommand(msg);
      }
    });

    console.log('N7M hook initialized');
  }

  private async handleN7MCommand(msg: Message) {
    try {
      // Extract the text from the message (remove the prefix)
      const text = msg.content.substring(this.prefix.length).trim();
      
      if (!text) {
        await msg.reply('Please provide text to translate. Usage: `!n7m your text here`');
        return;
      }

      // Delete the original message
      await msg.delete();
      
      // Get translation from Claude using the N7M_PROMPT
      const prompt = `${N7M_PROMPT}\n\nTranslate the following text to numeronyms:\n"${text}"`;
      
      const response = await this.anthropicService.getCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.1 // Lower temperature for more deterministic results
      });

      // Create a new reply tagging the user who initiated the process
      // Use proper Discord mention format
      const translatedMessage = `<@${msg.author.id}>: ${response.trim()}`;
      
      // Send the translated message to the channel
      await msg.channel.send(translatedMessage);
    } catch (error) {
      console.error('Error in N7M hook:', error);
      // Since the original message is deleted, we'll send an error message to the channel
      await msg.channel.send(`Sorry <@${msg.author.id}>, I encountered an error while processing your request.`);
    }
  }
}
