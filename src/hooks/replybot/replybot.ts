import { Client, Message } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { throttle, ThrottleStrategy } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";
import * as rawconf from "./replybot.config.json";

const CACHE: any = {};

interface FireParams {
    replies: string[];
    message: Message;
}

interface ConfigItemRaw {
    triggers: string[];
    responses: string[];
    throttleSeconds?: number;
}

interface ConfigItem {
    triggers: RegExp[];
    responses: string[];
    throttleStrat: ThrottleStrategy<FireParams>;
    callback: (params: FireParams) => void;
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
                        fire: (params: FireParams) => {
                            const { replies: possibleReplies, message: msg } = params;
                            const randomReplyIndex = Math.floor(Math.random() * possibleReplies.length);
                            const reply = possibleReplies[randomReplyIndex];

                            msg.channel.send(reply);
                        },
                    })
                }) as ConfigItem;
            }
        );

        client.on("message", (message: Message) => {

            if (message.channel.type !== "text") {
                return;
            }
            if (message.member.user.bot === true) {
                return;
            }

            const possibleReplies: Array<((msg: Message) => void)> = [];

            for (const item of conf) {
                // note: shouldFire was not meant to be called outside 
                // the returned throttled function. I wouldn't copy this 
                // anywhere else because it might break in the future.
                // I'm trying to keep it from breaking for now, but 
                // no promises.
                if (item.throttleStrat.shouldFire({ replies: [], message })) {
                    const repliesForItem: string[] = [];
                    const matches = item.triggers.filter(trigger => trigger.test(message.content));
                    if (matches.length > 0) {
                        const randomIndex = Math.floor(Math.random() * item.responses.length);
                        const replyPattern = item.responses[randomIndex];
                        for (const m of matches) {
                            const execMatches = m.exec(message.content);
                            if (execMatches) {
                                const reply = execMatches[0].replace(m, replyPattern);
                                repliesForItem.push(reply);
                            }
                        }
                        possibleReplies.push((msg) => item.callback({replies: repliesForItem, message: msg}));
                    }
                }
            }

            if (possibleReplies.length > 0) {
                const randomIndex = Math.floor(Math.random() * possibleReplies.length);
                const reply = possibleReplies[randomIndex];
                reply(message);
            }
        });
    }
}
