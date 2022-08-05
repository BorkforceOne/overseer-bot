import { Client } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { Hook } from "../../utils/hook";

export class InnovateHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  public async init() {

    this.client.on("messageCreate", (msg) => {

      if (msg.member?.user?.bot !== false) {
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
      /(\W|^)u\s*of\s*a(?!\w)/g,
      /(\W|^)u\s*a(?!\w)/g,
      /(\W|^)university\s*\s*arizona(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchAsu(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)a\s*s\s*u(?!\w)/g,
      /(\W|^)arizona\s*state(?!\w)/g,
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
