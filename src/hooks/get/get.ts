import { Client } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { Hook } from "../../utils/hook";
import axios from 'axios';
import * as cheerio from 'cheerio';


export class GetHook implements Hook {
  private readonly client: Client;

  constructor(
    private readonly discordService: DiscordService,
  ) {
    this.client = this.discordService.getClient();
  }

  public async init() {
    const { client } = this;

    client.on("messageCreate", async (msg) => {

      if (msg.member?.user?.bot !== false) {
        return;
      }
      
      const instruction = match(msg.content);

      if (!instruction)
        return;

      switch (instruction.action) {
        case 'get': {
          const { searchTerm } = instruction.payload;
          const url = `https://www.google.com/search?q=${searchTerm}&safe=off&tbm=isch`;
          const res = await axios.get(url);
          const $ = cheerio.load(res.data);
          const imgs = $("img[src*=gstatic]").first().get();
          const img = imgs[0];
          const src = img.attribs['src'];
          const [title] = $("title").text().split('-');
          msg.reply({
            embeds: [{
              title,
              image: { url: src }
            }],
          });
          return;
        }
      }
    });
  }

} 

const match: (msg: string) => Instruction | undefined = (msg: string) => ([
  (msg: string) => {
    // Skip processing if the message starts with !n7m, !overseer, or !unn7m
    if (msg.toLowerCase().startsWith('!n7m') || msg.toLowerCase().startsWith('!overseer') || msg.toLowerCase().startsWith('!unn7m')) {
      return;
    }
    
    const patterns: RegExp[] = [
      /^show me\s+(.+)$/i,
      /^show\s+(.+)$/i,
      /^get\s+(.+)$/i,
      /^search\s+(.+)$/i,
      /^!\s*(.+)$/i,
    ];
    if (!patterns.some(r => r.test(msg))) {
      return;
    }
    return {
      action: 'get',
      payload: {
        searchTerm: patterns
          .map(r => msg.match(r))
          .find(m => m !== null)?.[1]
          .replace(/\s+/g,'+')
      }
    } as Instruction;
  },
].find(m => m(msg.toLowerCase())) || (() => undefined))(msg);

type Instruction = 
{
  action: 'get',
  payload: {
    searchTerm: string,
  },
}

export const get = {
  match,
}
