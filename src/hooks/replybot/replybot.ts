import { Client, Message } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { throttle, ThrottleStrategy } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";
import * as rawconf from "./replybot.config.json";

const CACHE: any = {};

interface ConfigItemRaw {
    triggers: string[];
    responses: string[];
    throttleSeconds?: number;
}

interface ConfigItem {
    triggers: RegExp[];
    responses: string[];
    throttleStrat: ThrottleStrategy<any>;
    callback: (possibleReplies: string[], msg: Message) => void;
}

type Config = ConfigItem[];

export class ReplybotHook implements Hook {
    private readonly client: Client;
    private readonly throttle: TimeThrottleStrategyService;

    constructor(
        private readonly discordService: DiscordService,
        private readonly timeThrottleStrategyService: TimeThrottleStrategyService
    ) {
        this.client = this.discordService.getClient();
        this.throttle = timeThrottleStrategyService;
    }

    public async init() {
        const { client } = this;

        const conf: Config = (rawconf as ConfigItemRaw[]).map(
            c => {
                const throttleStrat = this.throttle.getStrategy({
                    durationBeforeFiringAgainMs: (c.throttleSeconds || .1) * 1000,
                });

                return ({
                    responses: c.responses,
                    triggers: c.triggers.map(r => new RegExp(r, "i")),
                    throttleStrat,
                    callback: throttle({
                        throttleStrategies: [
                            throttleStrat,
                        ],
                        fire: (possibleReplies: string[], message: Message) => {
                            const randomReplyIndex = Math.floor(Math.random() * possibleReplies.length);
                            const reply = possibleReplies[randomReplyIndex];

                            message.channel.send(reply);
                        },
                    })
                }) as ConfigItem;
            }
        );

        client.on("message", (msg: Message) => {

            if (msg.channel.type !== "text") {
                return;
            }
            if (msg.member.user.bot === true) {
                return;
            }

            const possibleReplies: Array<((msg: Message) => void)> = [];

            for (const item of conf) {
                if (item.throttleStrat.shouldFire()) {
                    const repliesForItem: string[] = [];
                    const matches = item.triggers.filter(trigger => trigger.test(msg.content));
                    if (matches.length > 0) {
                        const randomIndex = Math.floor(Math.random() * item.responses.length);
                        const replyPattern = item.responses[randomIndex];
                        for (const m of matches) {
                            const execMatches = m.exec(msg.content);
                            if (execMatches) {
                                const reply = execMatches[0].replace(m, replyPattern);
                                repliesForItem.push(reply);
                            }
                        }
                        possibleReplies.push((msg) => item.callback(repliesForItem, msg));
                    }
                }
            }

            if (possibleReplies.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleReplies.length);
                const reply = possibleReplies[randomIndex];
                reply(msg);
            }
        });
    }
}
