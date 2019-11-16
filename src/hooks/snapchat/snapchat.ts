import { Hook } from '../../utils/hook';
import { TextChannel, Client } from 'discord.js';
import { DiscordService } from '../../services/app/discord_service';

export class SnapchatHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on('message', (msg) => {
      if (msg.channel.type !== 'text')
        return;

      const channel = msg.channel as TextChannel;

      // only delete messages in announcements
      if (channel.name !== 'announcements')
        return;

      // do not delete announcements, only discussions
      if (msg.content.toLowerCase().includes('!announcement'))
        return;

      // delete after five minutes
      msg.delete(1000 * 60 * 5);
    });
  }
}