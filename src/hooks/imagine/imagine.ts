import axios from "axios";
import { Client, Message, MessageAttachment, MessageEmbed } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { throttle } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";

const DURATION_BEFORE_FIRING_AGAIN_MS = 30 * 60 * 1000; // 30 minutes

const endpoint = "https://backend.craiyon.com/generate";

export class ImagineHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
    private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
  ) {
    this.client = this.discordService.getClient();
  }

  public async init() {
    const { client } = this;

    const throttledReply = throttle({
      fire: this.reply,
      throttleStrategies: [
        this.timeThrottleStrategyService.getStrategy({
          durationBeforeFiringAgainMs: DURATION_BEFORE_FIRING_AGAIN_MS
        }),
      ],
    });

    client.on("message", async (msg) => {
      if (msg.member?.user?.bot !== false) {
        return;
      }
      
      const instruction = match(msg.content);

      if (!instruction)
        return;

      throttledReply({instruction, msg});
    });
  }

  public async reply({instruction, msg}: {instruction: Instruction, msg: Message}) {
    const { prompt } = instruction;

    console.log(`Requesting prompt: '${prompt}'`);

    msg.channel.startTyping();
    const res = await axios.post(endpoint, {
      prompt,
    }).finally(() => {
      msg.channel.stopTyping();
    });

    if (res.status !== 200) {
      return;
    }

    const images = res.data.images as string[];
    const image = images[0];
    const bufferedImage = Buffer.from(image, 'base64');
    const attachment = new MessageAttachment(bufferedImage, "imagine.png");
    const embed = new MessageEmbed();
    embed.setTitle(`Imagining ${prompt}...`);
    embed.setImage("attachment://imagine.png");
    return msg.reply({
      embed,
      files: [attachment],
    });
  }
} 

const match: (msg: string) => Instruction | undefined = (msg: string) => ([
  (msg: string) => {
    const patterns: RegExp[] = [
      /^imagine\s+(.+)$/i,
      /^what if\s+(.+)$/i,
    ];
    if (!patterns.some(r => r.test(msg))) {
      return;
    }
    return {
      prompt: patterns
      .map(r => msg.match(r))
      .find(m => m !== null)?.[1]
      .replace(/\s+/g,' ')
    } as Instruction;
  },
].find(m => m(msg.toLowerCase())) || (() => undefined))(msg);

type Instruction = 
{
  prompt: string,
}
