import axios from "axios";
import { Client, Message } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { CountThrottleStrategyService } from "../../services/throttle/countThrottleStrategy.service";
import { throttle } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";

const API = "https://api.datamuse.com/words";
const MAX_RESULTS = 1000;
const ACRO_REGEX = new RegExp("^[A-Z]+$");
const CACHE: any = {};
const MAX_RESULTS_PER_MSG = 1;
const BLACKLISTED_WORDS = [
  "WHAT"
];
const NUM_MESSAGES_BEFORE_FIRING_AGAIN = 10;
const DURATION_BEFORE_FIRING_AGAIN_MS = 30 * 60 * 1000;

export class AcromeanHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
    private readonly countThrottleStrategyService: CountThrottleStrategyService,
    private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
  ) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    const throttledReply = throttle({
      fire: this.reply,
      throttleStrategies: [
        this.countThrottleStrategyService.getStrategy({
          numCallsBeforeFiringAgain: NUM_MESSAGES_BEFORE_FIRING_AGAIN
        }),
        this.timeThrottleStrategyService.getStrategy({
          durationBeforeFiringAgainMs: DURATION_BEFORE_FIRING_AGAIN_MS
        }),
      ],
    });

    client.on("message", (msg) => {
      if (msg.channel.type === "text") {
        if (msg.member.user.bot === false) {
          let timesRan = 0;
          const splits = msg.content.split(" ");
          for (const acro of splits) {
            if (acro.length > 1 && acro.match(ACRO_REGEX) && BLACKLISTED_WORDS.indexOf(acro) === -1) {
              if (timesRan < MAX_RESULTS_PER_MSG) {
                throttledReply({acro, msg});
                timesRan++;
              }
            }
          }
        }
      }
    });
  }

  reply(opts: {
    acro: string, msg: Message
  }) {
    const { 
      acro, msg,
    } = opts;
    const promises = [];
    const types: string[] = [];
    for (let i = 0; i < acro.length; i++) {
      promises.push(getForLetter(acro[i]));
      if (i === 0) {
        types.push("v");
      } else if (i < acro.length - 1) {
        types.push("adj");
      } else {
        types.push("n");
      }
    }
    Promise.all(promises).then(results => {
      const finalWords = [];
      for (const data of results) {
        const type = types.shift();
        const filtered = (data as any[]).filter(d => d.tags && d.tags.indexOf(type) > -1);
        finalWords.push(sentenceCase(choose<any>(filtered).word));
      }
      msg.channel.send(`${acro} (${finalWords.join(" ")})`);
    });
  }
}

async function getForLetter(letter: string) {
  if (CACHE[letter]) {
    return CACHE[letter];
  }
  const url = `${API}?sp=${letter}*&md=p&max=${MAX_RESULTS}`;
  const result = await axios.get(url);
  const { data } = result;
  CACHE[letter] = data;
  return data;
}

function choose<E>(input: E[]): E {
  return input[Math.round(Math.random() * input.length)];
}

function sentenceCase(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}