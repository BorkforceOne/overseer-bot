import { Client, Message, Emoji, GuildEmoji } from 'discord.js';
import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/app/discord_service';
import { RandomThrottleStrategyService } from '../../services/throttle/randomThrottleStrategy.service';
import { throttle } from '../../services/throttle/throttle';
import { emojiList } from '../../utils/emojiList';


export class RandomojiHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
    private readonly randomThrottleStrategyService: RandomThrottleStrategyService,
  ) {
    this.client = this.discordService.getClient();
  }

  async init() {


    const react = throttle({
      throttleStrategies: [
        this.randomThrottleStrategyService.getStrategy({
          chance: 1 / 74,
        })
      ],
      fire: (message: Message) => {
        const emojis = [
          ...emojiList,
          ...message.guild!.emojis.cache.map((e: GuildEmoji) => e.identifier),
        ];

        const randomIndex = Math.floor(Math.random() * emojis.length);
        const emoji = emojis[randomIndex];

        if (emoji && message.author.bot === false) {
          message.react(emoji);
        }
      },
    });


    this.client.on('messageCreate', (message) => {
      react(message);
    });
  }

}

