import { Hook } from '../../utils/hook';
import { Client, Message } from 'discord.js';
import { DiscordService } from '../../services/app/discord_service';
import { AnthropicService } from '../../services/app/anthropic_service';
import { UN7N7M_PROMPT } from '../../utils/prompts';

export class Unn7mHook implements Hook {
  private readonly client: Client;
  private readonly command: string = '!unn7m';

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

      // Check if the message is exactly the command and is a reply to another message
      if (msg.content.trim() === this.command && msg.reference && msg.reference.messageId) {
        await this.handleUnn7mCommand(msg);
      }
    });

    console.log('Unn7m hook initialized');
  }

  private async handleUnn7mCommand(msg: Message) {
    try {
      // Fetch the message being replied to
      const referencedMessage = await msg.channel.messages.fetch(msg.reference!.messageId!);
      
      if (!referencedMessage) {
        await msg.reply('Could not find the message you replied to.');
        return;
      }

      // Get the content of the referenced message
      const text = referencedMessage.content;
      
      if (!text) {
        await msg.reply('The message you replied to has no content to reverse.');
        return;
      }

      // Get reverse translation from Claude using the UN7N7M_PROMPT
      const prompt = `${UN7N7M_PROMPT}\n\nReverse engineer the following numeronym text to its likely original form:\n"${text}"`;
      
      const response = await this.anthropicService.getCompletion(prompt, {
        maxTokens: 1000,
        temperature: 0.7 // Higher temperature for more creative results since this is a guessing task
      });

      // Create a reply with just the reversed text
      const reversedMessage = `${response.trim()}`;
      
      // Send the reversed message to the channel
      await msg.channel.send(reversedMessage);
    } catch (error) {
      console.error('Error in Unn7m hook:', error);
      await msg.reply('Sorry, I encountered an error while processing your request.');
    }
  }
}
