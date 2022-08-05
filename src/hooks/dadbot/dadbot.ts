import { ChannelType, Client, Message } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { AndThrottleStrategyService } from "../../services/throttle/andThrottleStrategy.service";
import { FuckOffThrottleStrategyService } from "../../services/throttle/fuckOffThrottleStrategy.service";
import { throttle, ThrottleStrategy } from "../../services/throttle/throttle";
import { TimeThrottleStrategyService } from "../../services/throttle/timeThrottleStrategy.service";
import { Hook } from "../../utils/hook";
import { FuckOffStateManager } from "../fuckoff/fuckoff";
import { RegexpGenerateMessage } from "../../utils/regexp";

interface FireParams {
    reply: string;
    message: Message;
}

const dadbotConfig = {
    trigger: /\b(i'?m|i am) ([^.,;!:?]+)\b(?!\?)/,
    responses: [
        "Hi $2, I'm Dad.",
        "Hi $2, I'm Dad.",
        "Hello $2, I'm Dad.",
        "Hi $2, I'm Overseer.",
        "Hi $2, I'm Dad.",
        "Hi $2, I'm Dad.",
        "Hi $2, I'm Overseer.",
        "Hi $2, I'm Dad.",
        "Howdy $2, I'm Overseer.",
        "Hi $2, I'm Dad.",
        "Hi $2, I'm Overseer.",
        "Hello $2, I'm Dad.",
        "Hi $2, I'm Overseer.",
        "Greetings $2, I'm Dad.",
        "Suh $2, I'm Overseer.",
        "Hi $2, I'm Dad.",
        "Hi $2, I'm Overseer.",
        "Hey $2, I'm Daddy Overseer."
    ]
};

export class DadbotHook implements Hook {
    private readonly client: Client;

    constructor(
        private readonly discordService: DiscordService,
        private readonly timeThrottleStrategyService: TimeThrottleStrategyService,
        private readonly fuckOffThrottleStrategyService: FuckOffThrottleStrategyService<FireParams>,
        private readonly andThrottleStrategyService: AndThrottleStrategyService<FireParams>
    ) {
        this.client = this.discordService.getClient();
    }

    public async init() {
        const { client } = this;

        const reply = throttle({
            throttleStrategies: [
                this.andThrottleStrategyService.getStrategy({
                    throttles: [
                        this.fuckOffThrottleStrategyService.getStrategy({
                            hookId: "dadbot",
                            shouldFire: FuckOffStateManager.shouldFire,
                        }),
                        this.timeThrottleStrategyService.getStrategy({
                            durationBeforeFiringAgainMs: 24 * 60 * 60 * 1000, // dadbot only once a day
                        }),
                    ],
                }),
            ],
            fire: (params: FireParams) => {
                const { reply, message: msg } = params;
                msg.channel.send(reply);
            },
        });


        client.on("messageCreate", (message: Message) => {

            if (message.channel.type !== ChannelType.GuildText) {
                return;
            }
            if (message.member?.user?.bot !== false) {
                return;
            }

            const randomIndex = Math.floor(Math.random() * dadbotConfig.responses.length);
            const replyPattern = dadbotConfig.responses[randomIndex];
            const replyMessage = RegexpGenerateMessage(dadbotConfig.trigger, message.content, replyPattern);
            if (replyMessage) {
                reply({
                    message,
                    reply: replyMessage,
                });
            }
        });
    }
}
