import { Client, Emoji, Message, Channel } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { DataService } from "../../services/app/data_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";
import * as puppeteer from 'puppeteer';

const decrement = firestore.FieldValue.increment(-1);
const increment = firestore.FieldValue.increment(1);
const channelName = 'war-of-the-davids';

// https://www.toptal.com/puppeteer/headless-browser-puppeteer-tutorial

/**
 * features:
 *  * vote eck - vote for eck as the worst david
 *  * vote peace - vote for peace cream david as the best david
 *  * display votes - see the vote count so far
 */
export class DavidBotHook implements Hook {
  private readonly client: Client;
  private readonly db: firestore.Firestore;
  private emojis: {[name: string]: Emoji} = {};
  private scan: NodeJS.Timeout;

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
    this.scan = this.startScan();
  }

  private react({ name, msg }: { name: string, msg: Message }) {
    msg.react(msg.guild.emojis.find(emoji => emoji.name === name).identifier);
  }

  private async _init() {
    const doc = await this.db.collection('app-data').doc('david-bot').get();
    const data = doc.data() as any;
    if (!doc.exists) {
      await this.db.collection('app-data').doc('david-bot').create({
        votes: {
          eck: 0,
          peace: 0,
        },
        sender: {
          peace: false,
          eck: false,
        },
      });
    } else if (!data.sender) {
      await this.db.collection('app-data')
        .doc('david-bot').set({
          sender: {
            peace: false,
            eck: false,
          },
        }, { merge: true });
    }
  }

  private startScan() {
    const scanInterval = 5 * 60 * 1000;
    const scan = async () => {
      const url = `https://www.instagram.com/israeliarsenal/`;
      const browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'development'
      });
      const page = await browser.newPage();
      await page.goto(url);
      const urls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*=p]'))
          .filter((el): el is HTMLAnchorElement => el.tagName === 'A')
          .filter(el => el.href.includes('/p/'))
          .map(el => el.href)
          ;
      });
      urls.forEach(async url => {
        const id = url.split('https://www.instagram.com/p/')[1].replace(/\//g,'');
        const path = `posts.peace.${id}`;
        const doc = (await this.db.collection('app-data')
          .doc('david-bot')
          .get()).data() as any;
        if (!doc[path]) {
          await this.db.collection('app-data')
            .doc('david-bot').set({
              [path]: {
                id,
                url: url,
              }
            }, { merge: true });
          if (doc.sender?.peace) {
            // the docs don't show these features exist,
            // but I found them on stack overflow and they work
            // https://stackoverflow.com/questions/51120073/how-to-send-a-message-to-a-specific-channel
            const channels = this.client.channels as any;
            const channel = channels.find('name', channelName) as any;
            channel.send(`
New post from David! To vote, react with \`:peacecream:\` or say vote peace
${url}
          `);
          }
        }
      });
      browser.close();
    } 
    scan();
    return setInterval(scan, scanInterval);
  }

  private async endScan() {
    clearInterval(this.scan);
  }

  public async init() {
    await this._init();

    this.client.on('messageReactionAdd', async (reaction) => {
      if (reaction.emoji.name === 'eck') {
        await this.db.collection('app-data')
          .doc('david-bot').update({ 'votes.eck': decrement });
      }
      if (reaction.emoji.name === 'peacecream') {
        await this.db.collection('app-data')
          .doc('david-bot').update({ 'votes.peace': increment });
      }
    });

    this.client.on("message", async (msg) => {

      if (this.matchEck(msg.content)) {
        this.react({
          name: 'eck',
          msg,
        });
      } 
      else if (this.matchPeaceCream(msg.content)){
        this.react({
          name: 'peacecream',
          msg,
        });
      }
      else if (this.matchDisplayVote(msg.content)){
        const doc = await this.db.collection('app-data').doc('david-bot').get();
        const { votes } = doc.data() as any;
        msg.reply(`
**The votes so far**

David Eck: ${votes.eck}
David Peace Cream: ${votes.peace}
        `);
      }
    });
  }

  public matchPeaceCream(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)vote peace(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchEck(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)vote eck(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchDisplayVote(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)display votes(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }
}
