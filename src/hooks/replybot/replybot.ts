import { Client, Message } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { AndThrottleStrategyService } from "../../services/throttle/andThrottleStrategy.service";
import { CountThrottleStrategyService } from "../../services/throttle/countThrottleStrategy.service";
import { FuckOffThrottleStrategyService } from "../../services/throttle/fuckOffThrottleStrategy.service";
import { throttle, ThrottleStrategy } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";
import { RegexpGenerateMessage } from "../../utils/regexp";
import { FuckOffStateManager } from "../fuckoff/fuckoff";
import * as rawconf from "./replybot.config.json";

interface FireParams {
    possibleReplies: string[];
    message: Message;
}

interface ConfigItemRaw {
    triggers: string[];
    responses: string[];
    throttleSeconds?: number;
    fuckoff?: boolean;
    throttleCount?: number;
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

    constructor(
        private readonly discordService: DiscordService,
        private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
        private readonly fuckOffThrottleStrategyService: FuckOffThrottleStrategyService<FireParams>,
        private readonly andThrottleStrategyService: AndThrottleStrategyService<FireParams>,
        private readonly countThrottleStrategyService: CountThrottleStrategyService
    ) {
        this.client = this.discordService.getClient();
    }

    public async init() {
        const { client } = this;

        const conf: Config = (rawconf as ConfigItemRaw[]).map(
            c => {

                const throttles = [];

                if (c.fuckoff) {
                    throttles.push(this.fuckOffThrottleStrategyService.getStrategy({
                        hookId: "replybot",
                        shouldFire: FuckOffStateManager.shouldFire,
                    }));
                }

                if (c.throttleSeconds) {
                    throttles.push(this.timeThrottleStrategyService.getStrategy({
                        durationBeforeFiringAgainMs: (c.throttleSeconds || .1) * 1000,
                    }));
                }

                if (c.throttleCount) {
                    throttles.push(this.countThrottleStrategyService.getStrategy({
                        numCallsBeforeFiringAgain: 10,
                    }));
                }

                const throttleStrat = this.andThrottleStrategyService.getStrategy({ throttles });

                return ({
                    responses: c.responses,
                    triggers: c.triggers.map(r => new RegExp(r, "i")),
                    throttleStrat,
                    callback: throttle({
                        throttleStrategies: [
                            throttleStrat,
                        ],
                        fire: (params: FireParams) => {
                            const { possibleReplies, message: msg } = params;
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
            if (message.member?.user?.bot !== false) {
                return;
            }

            const replyFunctions: Array<((msg: Message) => void)> = [];

            for (const item of conf) {
                // note: shouldFire was not meant to be called outside 
                // the returned throttled function. I wouldn't copy this 
                // anywhere else because it might break in the future.
                // I'm trying to keep it from breaking for now, but 
                // no promises.
                if (item.throttleStrat.shouldFire({ possibleReplies: [], message })) {
                    const possibleReplies: string[] = [];
                    const matches = item.triggers.filter(trigger => trigger.test(message.content));
                    matches.forEach(matchedRegex => {
                        const randomIndex = Math.floor(Math.random() * item.responses.length);
                        const replyPattern = item.responses[randomIndex];
                        possibleReplies.push(RegexpGenerateMessage(matchedRegex, message.content, replyPattern)!);
                        replyFunctions.push((msg) => item.callback({ possibleReplies, message: msg }));
                    });
                }
            }

            if (replyFunctions.length > 0) {
                const randomIndex = Math.floor(Math.random() * replyFunctions.length);
                const reply = replyFunctions[randomIndex];
                reply(message);
            }
        });
    }
}
