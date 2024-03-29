import axios from "axios";
import { Client, Message, AttachmentBuilder, EmbedBuilder } from "discord.js";
import sharp = require("sharp");
import { DiscordService } from "../../services/app/discord_service";
import { throttle } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";
import { Direction, mergeImg } from "./image-utils";

const DURATION_BEFORE_FIRING_AGAIN_MS = 10 * 60 * 1000; // 10 minutes

const endpoint = "https://backend.craiyon.com/generate";

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

  constructor(
    private readonly discordService: DiscordService,
    private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
  ) {
    this.client = this.discordService.getClient();
  }

  public async init() {
    const { client } = this;

    client.on("messageCreate", async (msg) => {
      if (msg.member?.user?.bot !== false) {
        return;
      }

      const instruction = match(msg.content);

      if (!instruction) {
        return;
      }
  
      this.throttledReply({prompt: instruction.prompt, msg});  
    });
  }
  
  public async reply({prompt, msg}: {prompt: string, msg: Message}) {
    console.log(`Requesting prompt: '${prompt}'`);

    const hmmMessage = await msg.reply('Hmmm...');

    try {
      const res = await axios.post(endpoint, {
        prompt,
      });
  
      if (res.status !== 200) {
        throw new Error('API returned non-ok response.');
      }
  
      const images = res.data.images as string[];
      const rawBuffers = images.map((image) => Buffer.from(image, 'base64'));
      const pngBuffers = await Promise.all(rawBuffers.map((buffer) => sharp(buffer).png().toBuffer()));
      const finalImage = await mergeImages(pngBuffers);
  
      const attachment = new AttachmentBuilder(finalImage)
        .setName(`imagine.png`);
      const embed = new EmbedBuilder()
        .setImage(`attachment://imagine.png`)
        .setTitle(`Imagining ${prompt}...`)
        .setFooter({
          text: 'Brought to you by craiyon',
        });
      
      await msg.reply({
        embeds: [embed],
        files: [attachment],
      });  
    }
    catch(e) {
      await msg.reply("I'm sorry, I didn't understand.");
    }
    finally {
      await hmmMessage.delete();
    }
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

async function mergeImages(images: Buffer[]): Promise<Buffer> {
  const horizontal1 = await mergeImg([images[0], images[1], images[2]], {direction: Direction.HORIZONTAL, offset: 10});
  const horizontal2 = await mergeImg([images[3], images[4], images[5]], {direction: Direction.HORIZONTAL, offset: 10});
  const horizontal3 = await mergeImg([images[6], images[7], images[8]], {direction: Direction.HORIZONTAL, offset: 10});
  const final = await mergeImg([horizontal1, horizontal2, horizontal3], {direction: Direction.VERTICAL, offset: 10});

  return final;
}

type Instruction = 
{
  prompt: string,
}
