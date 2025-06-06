import { Hook } from '../../utils/hook';
import { Client, Message } from 'discord.js';
import { DiscordService } from '../../services/app/discord_service';
import { AnthropicService } from '../../services/app/anthropic_service';
import { UN7N7M_PROMPT } from '../../utils/prompts';

export class Un7n7mHook implements Hook {
  private readonly client: Client;
  private readonly prefix: string = '!un7n7m';

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
        await this.handleUn7n7mCommand(msg);
      }
    });

    console.log('Un7n7m hook initialized');
  }

  private async handleUn7n7mCommand(msg: Message) {
    try {
      // Extract the text from the message (remove the prefix)
      const text = msg.content.substring(this.prefix.length).trim();
      
      if (!text) {
        await msg.reply('Please provide numeronym text to reverse. Usage: `!un7n7m your n7m t2t here`');
        return;
      }

      // Get the original message for reference
      const originalMessage = msg.content;
      
      // Get reverse translation from Claude using the UN7N7M_PROMPT
      const prompt = `${UN7N7M_PROMPT}\n\nReverse engineer the following numeronym text to its likely original form:\n"${text}"`;
      
      const response = await this.anthropicService.getCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.7 // Higher temperature for more creative results since this is a guessing task
      });

      // Create a reply with both the numeronym and the reversed text
      const reversedMessage = `<@${msg.author.id}> attempted to reverse:\n> ${text}\n\nPossible original text:\n${response.trim()}`;
      
      // Send the reversed message to the channel
      await msg.channel.send(reversedMessage);
    } catch (error) {
      console.error('Error in Un7n7m hook:', error);
      await msg.reply('Sorry, I encountered an error while processing your request.');
    }
  }
}
