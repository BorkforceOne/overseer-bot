import { Client } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { OnOffOpts } from "../../services/throttle/fuckOffThrottleStrategy.service";
import { Hook } from "../../utils/hook";

const hookIds = [
  "foogle",
  "replybot",
];

interface FuckOffStatus {
  userId: string;
  hookId: string;
  isActive: boolean;
}

const FuckOffState: { [id: string]: FuckOffStatus } = {};

export const FuckOffStateManager = {
  /** tell a bot to fuck off for good */
  fuckOff: (opts: OnOffOpts) => {
    const { hookId, userId } = opts;
    FuckOffState[userId + "." + hookId] = { 
      userId,
      hookId,
      isActive: false
    };
  },
  /** tell a bot to turn back on */
  turnOn: (opts: OnOffOpts) => {
    const { hookId, userId } = opts;
    FuckOffState[userId + "." + hookId] = { 
      userId,
      hookId,
      isActive: true
    };
  },
  /** whether or not a bot was told to fuck off */
  shouldFire: (opts: OnOffOpts) => {
    const { hookId, userId } = opts;
    const status = FuckOffState[userId + "." + hookId];
    return status === undefined || status.isActive;
  },
};

export class FuckOffHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
  ) {
    this.client = this.discordService.getClient();
  }

  public async init() {
    this.client.on("message", (msg) => {
      if (msg.channel.type !== "text") {
        return;
      }
      if (msg.author.bot === true) {
        return;
      }
      const userId = msg.author.username;
      const text = msg.content.toLowerCase();
      const hookId = hookIds.find(id => text.includes(id));
      if (hookId === undefined) {
        return;
      }
      if (/^fuck ?off/.test(text)) {
        FuckOffStateManager.fuckOff({
          hookId,
          userId,
        });
        msg.reply("ok, ok, fucking off");
      }
      if ([/^we're cool/, /^we're good/].some(regx => regx.test(text))) {
        FuckOffStateManager.turnOn({
          hookId,
          userId,
        });
        msg.reply("back in business, baby!");
      }
    });
  }
}