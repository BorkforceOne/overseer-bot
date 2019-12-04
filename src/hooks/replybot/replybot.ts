import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/app/discord_service';
import { Client, Message } from 'discord.js';
import * as rawconf from "./replybot.config.json";
import { TimeThrottleStrategyService } from '../../services/throttle/timeThrottleStrategy.service';
import { throttle } from '../../services/throttle/throttle';

const CACHE: any = {};

interface ConfigItem {
	triggers: RegExp[];
	responses: string[];
}

type Config = ConfigItem[];

const conf: Config = rawconf.map(
	c => ({
		responses: c.responses,
		triggers: c.triggers.map(r => new RegExp(r, 'i')),
	})
);


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

	async init() {
		const { client } = this;

		const strat = this.throttle.getStrategy({
			durationBeforeFiringAgainMs: 1000,
		});

		const reply = throttle({
			throttleStrategies: [
				strat,
			],
			fire: (possibleReplies: string[], message: Message) => {
				const randomReplyIndex = Math.floor(Math.random() * possibleReplies.length);
				const reply = possibleReplies[randomReplyIndex];

				message.channel.send(reply);
			},
		});

		client.on("message", (msg: Message) => {
			
			if (msg.channel.type !== 'text') {
				return;
			}
			if (msg.member.user.bot === true) {
				return;
			}

			if (strat.shouldFire()) {
				const possibleReplies = [];
	
				for (const item of conf) {
					const matches = item.triggers.filter(trigger => trigger.test(msg.content));
					if (matches.length > 0) {
						const randomIndex = Math.floor(Math.random() * item.responses.length);
						const replyPattern = item.responses[randomIndex];
						for (const m of matches) {
							const reply = msg.content.replace(m, replyPattern);
							possibleReplies.push(reply);
						}
					}
				}
	
				if (possibleReplies.length > 0) {
					reply(possibleReplies, msg);
				}
			}
			else {
				console.log('nope');
			}

		});
	}
}
