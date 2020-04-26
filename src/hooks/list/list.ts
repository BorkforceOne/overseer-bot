import { Client, RichEmbed } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";
import { DataService } from "../../services/app/data_service";

/** the collection for this bot */
const repo = 'list';

const compareItems = (a: Item, b: Item) => 
  b.upvoters.length - b.downvoters.length 
    - (a.upvoters.length - a.downvoters.length);

const sortItems = (list: List) => {
  return list.data.items.ids
    .map(id => list.data.items.byId[id])
    .sort(compareItems)
    .map(item => item.id);
}

export class ListHook implements Hook {
  private readonly client: Client;
  private readonly db: firestore.Firestore;

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
  }

  public async init() {
    const { client } = this;

    client.on("message", async (msg) => {

      if (msg.member.user.bot === true) {
        return;
      }
      
      const instruction = this.match(msg.content);

      if (!instruction)
        return;

      switch (instruction.action) {
        case 'touch': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list)
            return `create list ${payload.list} failed.`;

          return msg.reply(`created list: ${list.data.name}`);
        }
        case 'add': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list)
            return `add ${payload.item} to list ${payload.list} failed.`;
          
          list.data.items.ids.push(payload.item);
          list.data.items.byId[payload.item] = {
            id: payload.item,
            downvoters: [],
            upvoters: [msg.author.username],
          };
          await this.update(payload.list, list);

          return msg.reply(`added ${payload.item} to list: ${list.data.name}`);
        }
        case 'rm': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list)
            return `remove ${payload.item} to list ${payload.list} failed.`;
          
          list.data.items.ids = list.data.items.ids
            .filter(i => i !== payload.item);
          delete list.data.items.byId[payload.item];
          await this.update(payload.list, list);

          return msg.reply(`removed ${payload.item} from list: ${list.data.name}`);
        }
        case '-1':
        case '+1': {
          const { payload, action } = instruction;
          const upvote = action == '+1';
          const remove = upvote ? 'downvoters' : 'upvoters';
          const add = !upvote ? 'downvoters' : 'upvoters';
          const list = await this.list(payload.list); 
          if (!list)
            return `+1 ${payload.item} to list ${payload.list} failed.`;
          
          const itemId = list.data.items.ids
            .find(i => i === payload.item);
          if (!itemId)
            return `+1 ${payload.item} to list ${payload.list} failed.`;
          const item = list.data.items.byId[itemId];
          if (item[add].some(d => d === msg.author.username))
            return msg.reply(`you already ${action}'d ${payload.item} in list: ${list.data.name}`);
          if (item[remove].some(d => d === msg.author.username)) {
            item[remove] = item[remove]
              .filter(d => d !== msg.author.username);
          } else {
            item[add].push(msg.author.username);
          }

          await this.update(payload.list, list);

          return msg.reply(`${action}'d ${payload.item} in list: ${list.data.name}`);
        }
        case 'ls': {
          const { payload } = instruction;
          const list = await this.list(payload.list);
          if (!list)
            return `listing ${payload.list} failed.`;
          const resp = new RichEmbed()
            .setAuthor(
              client.user.username,
              client.user.avatarURL,
            )
            .setTitle(payload.list)
            ;
          const items = list.data.items.ids
            .map(id => list.data.items.byId[id])
            .sort(compareItems)
            .map(i => `${i.upvoters.length - i.downvoters.length}: ${i.id}`)
            .join('\n') || 'None';
          resp.addField('Items', items);
          return msg.reply(resp);
        }
        case 'help': {
          return msg.reply(`
\`list\` bot lets you keep track and vote on items in a list.

Example usage:
\`\`\`sh
touch movies
add movies Boondock Saints
ls movies
-1 movies Boondock Saints
+1 movies Boondock Saints
rm movies Boondock Saints
\`\`\`
          `);
        }
        default:
          const _exhaustiveSwitch: never = instruction;
      }
    });
  }
  
  private async update(id: string, list: List) {
    await this.list(id);
    await this.db.collection(repo).doc(id).set(list.data);
  }

  private async list(list: string): Promise<List> {
    let doc = await this.db.collection(repo).doc(list).get();
    if (!doc.exists) {
      await this.db.collection(repo).doc(list).create({
        name: list,
        items: {
          byId: {},
          ids: [],
        },
      });
    }
    return {
      id: doc.id,
      data: doc.data() as any,
    };
  } 

  public match = (msg: string) => ([
    (msg: string) => {
      const patterns: RegExp[] = [
        /^ls \w+$/g,
        /^list \w+$/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: 'ls',
        payload: {
          list: msg.split(' ')[1],
        },
      } as Instruction;
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^add \w+ \w+/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: 'add',
        payload: {
          list: msg.split(' ')[1],
          item: msg.split(' ').slice(2).join(' '),
        },
      } as Instruction;
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^rm \w+ \w+/g,
        /^remove \w+ \w+/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: 'rm',
        payload: {
          list: msg.split(' ')[1],
          item: msg.split(' ').slice(2).join(' '),
        },
      } as Instruction;
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^\+1 \w+ \w+/g,
        /^plus one \w+ \w+/g,
        /^upvote \w+ \w+/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: '+1',
        payload: {
          list: msg.split(' ')[1],
          item: msg.split(' ').slice(2).join(' '),
        },
      } as Instruction;
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^\-1 \w+ \w+/g,
        /^minus one \w+ \w+/g,
        /^downvote \w+ \w+/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: '-1',
        payload: {
          list: msg.split(' ')[1],
          item: msg.split(' ').slice(2).join(' '),
        },
      } as Instruction;
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^list$/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: 'help',
        payload: {},
      } as Instruction;
    },
  ].find(m => m(msg.toLowerCase()))||(()=>null))(msg);
} 

type Instruction = 
{
  action: 'help',
  payload: {},
}
|
{
  action: 'touch',
  payload: {
    list: string,
  },
}
|
{
  action: 'add',
  payload: {
    list: string,
    item: string,
  },
}
|
{
  action: 'ls',
  payload: {
    list: string,
  },
}
|
{
  action: 'rm',
  payload: {
    list: string,
    item: string,
  },
}
|
{
  action: '+1',
  payload: {
    list: string,
    item: string,
  },
}
|
{
  action: '-1',
  payload: {
    list: string,
    item: string,
  },
}

interface Item {
  id: string,
  /** people who voted up on this item */
  upvoters: string[],
  /** people who voted down on this item */
  downvoters: string[],
}

interface List {
  id: string,
  data: {
    name: string,
    items: {
      ids: string[];
      byId: {[id:string]: Item}
    }
  }
}