import { Hook } from '../../hook';
import { TextChannel } from 'discord.js';

export class SnapchatHook extends Hook {
  public init() {
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