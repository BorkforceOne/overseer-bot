import axios from "axios";
import { Client, Message, MessageAttachment, MessageEmbed } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { AndThrottleStrategyService } from "../../services/throttle/andThrottleStrategy.service";
import { RandomThrottleStrategyService } from "../../services/throttle/randomThrottleStrategy.service";
import { throttle } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";

const DURATION_BEFORE_FIRING_AGAIN_MS = 10 * 60 * 1000; // 10 minutes

const endpoint = "https://backend.craiyon.com/generate";

interface FireParams {
  prompt: string;
  msg: Message;
}

export class ImagineHook implements Hook {
  private readonly client: Client;

  private readonly throttledReply = throttle({
    fire: this.reply,
    throttleStrategies: [
      this.timeThrottleStrategyService.getStrategy({
        durationBeforeFiringAgainMs: DURATION_BEFORE_FIRING_AGAIN_MS
      }),
    ],
  });

  private readonly randomReply = throttle({
    fire: this.reply,
    throttleStrategies: [
      this.andThrottleStrategyService.getStrategy({
        throttles: [
          this.randomThrottleStrategyService.getStrategy({
            chance: 1 / 200,
          }),
          this.timeThrottleStrategyService.getStrategy({
            durationBeforeFiringAgainMs: DURATION_BEFORE_FIRING_AGAIN_MS
          }),
        ],
      })
    ],
  });

  constructor(
    private readonly discordService: DiscordService,
    private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
    private readonly randomThrottleStrategyService: RandomThrottleStrategyService,
    private readonly andThrottleStrategyService: AndThrottleStrategyService<FireParams>,
  ) {
    this.client = this.discordService.getClient();
  }

  public async init() {
    const { client } = this;

    client.on("message", async (msg) => {
      if (msg.member?.user?.bot !== false) {
        return;
      }

      const instruction = match(msg.content);

      if (!instruction) {
        this.randomReply({prompt: msg.content, msg});
        return;
      }
  
      this.throttledReply({prompt: instruction.prompt, msg});  
    });
  }
  
  public async reply({prompt, msg}: {prompt: string, msg: Message}) {
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
