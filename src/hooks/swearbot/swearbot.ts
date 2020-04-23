import { Client, Emoji, Message } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { DataService } from "../../services/app/data_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";
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
    /(\W|^)who shall be smote(?!\w)/g,
    /(\W|^)who is naughtiest(?!\w)/g,
    /(\W|^)who's naughty(?!\w)/g,
    /(\W|^)naughtybot(?!\w)/g,
    /(\W|^)swearbot(?!\w)/g,
    /(\W|^)swear-bot(?!\w)/g,

  To repent:
    /(\W|^)pray(?!\w)/g,
    /(\W|^)repent(?!\w)/g,
    /(\W|^)forgive me(?!\w)/g, 
 */
export class SwearBotHook implements Hook {
  private readonly client: Client;
  private readonly db: firestore.Firestore;
  private emojis: {[name: string]: Emoji} = {};

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
  }

  private react({ name, msg }: { name: string, msg: Message }) {
    msg.react(name);
  }

  private async _init() {
    const doc = await this.db.collection('app-data').doc(docId).get();
    if (!doc.exists) {
      await this.db.collection('app-data').doc(docId).create({
        swears: {},
      });
    }
  }

  public async init() {
    await this._init();

    this.client.on('messageReactionAdd', async (reaction) => {
      const user = reaction.message.author.username;
      if (reaction.emoji.name === badEmoji) {
        await this.db.collection('app-data')
          .doc(docId)
          .update({ [`swears.${user}`]: increment });
      }
      if (reaction.emoji.name === goodEmoji) {
        await this.db.collection('app-data')
          .doc(docId)
          .update({ [`swears.${user}`]: decrement });
      }
    });

    this.client.on("message", async (msg) => {

      if (msg.member.user.bot === true) {
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
        const doc = await this.db.collection('app-data').doc(docId).get();
        const { swears } = doc.data() as any;
        msg.reply(`
**The swears so far**
${Object.keys(swears).map(u => `${u}: ${swears[u]}`).join('\n')}
        `);
      }
    });
  }

  public matchGood(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)pray(?!\w)/g,
      /(\W|^)repent(?!\w)/g,
      /(\W|^)forgive me(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchBad(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    return new Profanease().check(msg);
  }

  public matchDisplayVote(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)who shall be smote(?!\w)/g,
      /(\W|^)who is naughtiest(?!\w)/g,
      /(\W|^)who's naughty(?!\w)/g,
      /(\W|^)naughtybot(?!\w)/g,
      /(\W|^)swearbot(?!\w)/g,
      /(\W|^)swear-bot(?!\w)/g,
      /(\W|^)swears(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }
}
