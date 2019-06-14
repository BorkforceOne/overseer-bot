import { Client } from "discord.js";

import { DiscordService } from "../../services/discord_service";
import { Hook } from "../../utils/hook";

export class InnovateHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  public async init() {

    this.client.on("message", (msg) => {

      if (msg.member.user.bot === true) {
        return;
      }

      if (this.matchAsu(msg.content)){
        msg.channel.send('(#1 in Innovation)');
      } 
      else if (this.matchInnovation(msg.content)){
        msg.channel.send('Did you mean "ASU"?');
      }
      else if (this.matchGarbage(msg.content)) {
        msg.channel.send(this.uOfAResponse);
      } 
    });
  }

  public matchGarbage(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /\Wu\s*of\s*a\W/g,
      /\Wu\s*\s*a\W/g,
      /\Wuniversity\s*\s*arizona\W/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchAsu(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /\Wa\s*s\s*u\W/g,
      /\Warizona\s*state\W/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchInnovation(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /innovate/g,
      /innovation/g,
      /innovating/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public get uOfAResponse(): string {
    const burns = [
      '"University" of Arizona',
      'Did you mean "Mexico"?',
    ];
    return this.randomOption(burns);
  }

  public randomOption<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
