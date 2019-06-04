import { Hook } from '../../hook';
import { GroupDMChannel } from 'discord.js';

export class SnapchatHook extends Hook {
  public init() {
    const { client } = this;

    client.on('message', (msg) => {
      if (msg.channel.type !== 'group')
        return;

      // fucking discord types are wrong
      const channel = msg.channel as GroupDMChannel;

      // only delete messages in announcements
      if (channel.name !== 'announcements')
        return;

      // do not delete announcements, only discussions
      if (msg.content.toLowerCase().includes('!announcement'))
      return;

      // delete after five minutes
      msg.delete(5 * 60);
    });
  }
}