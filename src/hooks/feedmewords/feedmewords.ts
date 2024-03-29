import { Client, Message, TextChannel } from 'discord.js';
import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/app/discord_service';

const REGEX = /^(?:-d )?<@\D?(\d+)>\s*reply(?: in <#(\d+)>)?(.+)$/i;

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
        this.client.on('messageCreate', async (message) => {

            const match = REGEX.exec(message.content);

            if (match) {
                const mentionedUserId = match[1];
                const mentionedUser = await message.client.users.fetch(mentionedUserId, {cache: true, force: true});
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
                            const channel = mentionedChannel.channel as TextChannel;
                            channel.sendTyping();
    
                            setTimeout(() => {
                              channel.send(intendedMessage.trim());
                            }, 1000);
                        }
                        finally {
                            if (message.content.startsWith('-d ')) {
                                await message.delete();
                            }
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
