import { Client, Message } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { FuckOffThrottleStrategyService } from "../../services/throttle/fuckOffThrottleStrategy.service";
import { throttle } from "../../services/throttle/throttle";
import { Hook } from "../../utils/hook";
import { FuckOffStateManager } from "../fuckoff/fuckoff";

const lmgtfyTemplate = "https://lmgtfy.com/?q=";
const hotword = "@google";
const responses = [
  "Here's what I found",
  "This is what I can find",
];

interface FireParams {
  message: Message;
}

/** Fake Google that just LMGTFYs whatever you look up */
/** This hook is not associated with Google in any way */
export class FoogleHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
    private readonly fuckOffThrottleStrategyService: FuckOffThrottleStrategyService<FireParams>,
    ) {
    this.client = this.discordService.getClient();
  }

  private fire = (params: FireParams) => {
    const { message } = params;
    const toEncode = message.content.slice(hotword.length).trim();
    if (toEncode.length === 0) {
      return;
    }
    const encodedURI = encodeURIComponent(toEncode);
    const response = responses[Math.floor(Math.random() * responses.length)];
    message.reply({
      embeds: [
        {
          description: `[${response}](${lmgtfyTemplate}${encodedURI})`,
        },
      ],
    });
  }

  async init() {
    const { client } = this;

    const throttledFire = throttle({
      fire: this.fire,
      throttleStrategies: [
        this.fuckOffThrottleStrategyService.getStrategy({
          hookId: "foogle",
          shouldFire: FuckOffStateManager.shouldFire,
        }),
      ],
    });

    client.on("messageCreate", (message) => {
      if (message.content.indexOf(hotword) === 0) {
        throttledFire({ message });
      }
    });
  }
}
