import { Client, Emoji, Message } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { DataService } from "../../services/app/data_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";
import { ListService } from "../../services/app/list_service";
const Profanease = require('profanease');

const decrement = firestore.FieldValue.increment(-1);
const increment = firestore.FieldValue.increment(1);
const docId = 'swear-bot';
const badEmoji = '👺';
const goodEmoji = '🙏🏻';

/**
 * features:
 * counts swears
 * 
 * To see swears:
    /^who shall be smote$/g,
    /^who is naughtiest$/g,
    /^who's naughty$/g,
    /^naughtybot$/g,
    /^swearbot$/g,
    /^swear-bot$/g,

  To repent:
    /^pray$/g,
    /^repent$/g,
    /^forgive me$/g, 
 */
export class SwearBotHook implements Hook {
  private readonly client: Client;
  private readonly db: firestore.Firestore | null;
  private blacklist: string[] = [];
  private whitelist: string[] = [];
  private emojis: {[name: string]: Emoji} = {};

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
    private readonly listService: ListService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
  }

  private react({ name, msg }: { name: string, msg: Message }) {
    msg.react(name);
  }

  private async _init() {
    if (this.db) {
      let doc = await this.db.collection('app-data').doc(docId).get();
      if (!doc.exists) {
        await this.db.collection('app-data').doc(docId).create({
          swears: {},
        });
      }
      await this.listService.list('swearsBlacklist');
      await this.listService.list('swearsWhitelist');
      this.listService.onSnapshot(l => {
        const list = l.data.items.ids.map(id => l.data.items.byId[id].id);
        switch (l.data.name) {
          case 'swearsBlacklist': {
            this.blacklist = list;
            break;
          }
          case 'swearsWhitelist': {
            this.whitelist = list;
            break;
          }
        }
      });
    }
  }

  public async init() {
    await this._init();

    this.client.on('messageReactionAdd', async (reaction) => {
      const user = reaction.message.author.username;
      if (reaction.emoji.name === badEmoji) {
        await this.db?.collection('app-data')
          .doc(docId)
          .update({ [`swears.${user}`]: increment });
      }
      if (reaction.emoji.name === goodEmoji) {
        await this.db?.collection('app-data')
          .doc(docId)
          .update({ [`swears.${user}`]: decrement });
      }
    });

    this.client.on("message", async (msg) => {

      if (msg.member?.user?.bot !== false) {
        return;
      }

      if (this.matchBad(msg.content)) {
        this.react({
          name: badEmoji,
          msg,
        });
      } 
      else if (this.matchGood(msg.content)){
        this.react({
          name: goodEmoji,
          msg,
        });
      }
      else if (this.matchDisplayVote(msg.content)){
        if (this.db) {
          const doc = await this.db.collection('app-data').doc(docId).get();
          const { swears } = doc.data() as any;
          msg.reply(`
**The swears so far**
${Object.keys(swears)
  .sort((a, b) => swears[b] - swears[a])
  .map(u => `${u}: ${swears[u]}`).join('\n')}
`);
        }
      }
    });
  }

  public matchGood(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /^pray$/g,
      /^repent$/g,
      /^forgive me$/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchBad(_msg: string): boolean {
    const msgs = _msg.toLowerCase()
      .split(' ')
      .map(w => w.match(/\w+/i)?.[0])
      .filter(w => w !== undefined)
      ;
    return new Profanease().check(_msg) 
      && !this.whitelist.some(w => msgs.some(m => m === w))
      || this.blacklist.some(w => msgs.some(m => m === w))
      ;
  }

  public matchDisplayVote(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [

      /^who shall be smote$/g,
      /^who is naughtiest$/g,
      /^who's naughty$/g,
      /^naughtybot$/g,
      /^swearbot$/g,
      /^swear-bot$/g,

    ];
    return patterns.some(r => r.test(msg));
  }
}
