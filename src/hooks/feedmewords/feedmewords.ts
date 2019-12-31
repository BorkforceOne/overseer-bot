import { Client, Message } from 'discord.js';
import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/app/discord_service';

const REGEX = /^<@!(\d+)>\s*reply(?: in <#(\d+)>)?(.+)$/i;

export class FeedMeWordsHook implements Hook {
    private readonly client: Client;
        
    private readonly CACHE: {
        [channelId: string]: Message;
    } = {};

    constructor(
        private readonly discordService: DiscordService,
      ) {
        this.client = this.discordService.getClient();
      }


    async init() {
        this.client.on('message', async (message) => {

            const match = REGEX.exec(message.content);
            if (match) {
                const mentionedUserId = match[1];
                const mentionedUser = await message.client.fetchUser(mentionedUserId, true);
                if (mentionedUser && mentionedUser.bot) {
                    // OK
                    let mentionedChannelId: string | undefined = match[2];
                    let mentionedChannel: Message | null = null;

                    if (mentionedChannelId === undefined && Object.keys(this.CACHE).length === 1) {
                        mentionedChannelId = Object.keys(this.CACHE)[0];
                    }

                    if (this.CACHE[mentionedChannelId]) {
                        mentionedChannel = this.CACHE[mentionedChannelId];
                    }
                    
                    if (mentionedChannel && message.deletable) {
                        
                        const intendedMessage = match[3];

                        try {
                            mentionedChannel.channel.startTyping();

                            await message.delete();
    
                            setTimeout(() => {
                                mentionedChannel!.channel.send(intendedMessage.trim());
                                mentionedChannel!.channel.stopTyping(true);
                            }, 1000);
                        }
                        finally {
                            delete this.CACHE[mentionedChannelId];
                        }

                    }
                }

            }
            else if (!message.author.bot) {
                this.CACHE[message.channel.id] = message;
            }
        });
    }
}
