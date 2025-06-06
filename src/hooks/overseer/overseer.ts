import { Hook } from '../../utils/hook';
import { Client, Message } from 'discord.js';
import { DiscordService } from '../../services/app/discord_service';
import { AnthropicService } from '../../services/app/anthropic_service';
import { OVERSEER_PROMPT } from '../../utils/prompts';

export class OverseerHook implements Hook {
  private readonly client: Client;
  private readonly prefix: string = '!overseer';

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
        await this.handleOverseerCommand(msg);
      }
    });

    console.log('Overseer hook initialized');
  }

  private async handleOverseerCommand(msg: Message) {
    try {
      // Extract the prompt from the message (remove the prefix)
      const prompt = msg.content.substring(this.prefix.length).trim();
      
      if (!prompt) {
        await msg.reply('Please provide a prompt for Overseer. Usage: `!overseer your question here`');
        return;
      }

      // Let the user know we're processing their request
      const loadingMessage = await msg.reply('Thinking...');
      
      // Get completion from Claude using the OVERSEER_PROMPT
      const fullPrompt = `${OVERSEER_PROMPT}\n\n${prompt}`;
      
      const response = await this.anthropicService.getCompletion(fullPrompt, {
        maxTokens: 1000,
        temperature: 0.7
      });

      // Split response if it's too long for Discord (Discord has a 2000 character limit)
      const chunks = this.splitMessage(response);
      
      // Delete the loading message
      await loadingMessage.delete();
      
      // Send each chunk as a separate message
      for (const chunk of chunks) {
        await msg.reply(chunk);
      }
    } catch (error) {
      console.error('Error in Overseer hook:', error);
      await msg.reply('Sorry, I encountered an error while processing your request.');
    }
  }

  private splitMessage(text: string, maxLength: number = 1900): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // Split by paragraphs first
    const paragraphs = text.split('\n\n');

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the max length, push the current chunk and start a new one
      if (currentChunk.length + paragraph.length + 2 > maxLength) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // Otherwise, add the paragraph to the current chunk
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }

    // Don't forget to add the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
