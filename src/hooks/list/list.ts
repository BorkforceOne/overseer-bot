import { APIEmbedField, Client, EmbedBuilder } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";
import { DataService } from "../../services/app/data_service";
import { Item, List, ListService } from "../../services/app/list_service";

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
  private readonly db: firestore.Firestore | null;

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
    private readonly listService: ListService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
  }

  public async init() {
    const { client } = this;

    client.on("messageCreate", async (msg) => {

      if (msg.member?.user?.bot !== false) {
        return;
      }
      
      const instruction = this.match(msg.content);

      if (!instruction)
        return;

      switch (instruction.action) {
        case 'touch': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list) {
            msg.reply(`create list ${payload.list} failed.`);
            return;
          }

          msg.reply(`created list: ${list.data.name}`);
          return;
        }
        case 'add': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list) {
            msg.reply(`add ${payload.item} to list ${payload.list} failed.`);
            return;
          }
          
          list.data.items.ids.push(payload.item);
          list.data.items.byId[payload.item] = {
            id: payload.item,
            downvoters: [],
            upvoters: [msg.author.username],
          };
          await this.update(payload.list, list);

          msg.reply(`added ${payload.item} to list: ${list.data.name}`);
          return;
        }
        case 'rm': {
          const { payload } = instruction;
          const list = await this.list(payload.list); 
          if (!list) {
            msg.reply(`remove ${payload.item} to list ${payload.list} failed.`);
            return;
          }
          
          list.data.items.ids = list.data.items.ids
            .filter(i => i !== payload.item);
          delete list.data.items.byId[payload.item];
          await this.update(payload.list, list);

          msg.reply(`removed ${payload.item} from list: ${list.data.name}`);
          return;
        }
        case '-1':
        case '+1': {
          const { payload, action } = instruction;
          const upvote = action == '+1';
          const remove = upvote ? 'downvoters' : 'upvoters';
          const add = !upvote ? 'downvoters' : 'upvoters';
          const list = await this.list(payload.list); 
          if (!list) {
            msg.reply(`+1 ${payload.item} to list ${payload.list} failed.`);
            return;
          }
          
          const itemId = list.data.items.ids
            .find(i => i === payload.item);
          if (!itemId) {
            msg.reply(`+1 ${payload.item} to list ${payload.list} failed.`);
            return;
          }
          const item = list.data.items.byId[itemId];
          if (item[add].some(d => d === msg.author.username)) {
            msg.reply(`you already ${action}'d ${payload.item} in list: ${list.data.name}`);
            return;
          }
          if (item[remove].some(d => d === msg.author.username)) {
            item[remove] = item[remove]
              .filter(d => d !== msg.author.username);
          } else {
            item[add].push(msg.author.username);
          }

          await this.update(payload.list, list);

          msg.reply(`${action}'d ${payload.item} in list: ${list.data.name}`);
          return;
        }
        case 'ls': {
          const { payload } = instruction;
          const list = await this.list(payload.list);
          if (!list) {
            msg.reply(`listing ${payload.list} failed.`);
            return;
          }
          const resp = new EmbedBuilder()
            .setAuthor(
              {
                name: client.user?.username ?? "",
                iconURL: client.user?.avatarURL() ?? undefined,
              }
            )
            .setTitle(payload.list);
          const fields: APIEmbedField[] = [];
          const items = list.data.items.ids
            .map(id => list.data.items.byId[id])
            .sort(compareItems)
            .map(i => `${i.upvoters.length - i.downvoters.length}: ${i.id}`)
            .join('\n') || 'None';
            
          resp.addFields([
            {name: 'Items', value: items},
          ]);
          msg.reply({
            embeds: [resp],
          });
          return;
        }
        case 'help': {
          msg.reply(`
\`list\` bot lets you keep track and vote on items in a list.

Example usage:
\`\`\`sh
ls .
touch movies
add movies Boondock Saints
ls movies
-1 movies Boondock Saints
+1 movies Boondock Saints
rm movies Boondock Saints
\`\`\`
          `);
        }
        return;
        case 'ls .': {
          const lists = await this.lists();
          const m = lists
            .map(l => `${l.data.name}: ${l.data.items.ids.length}`)
            .join('\n') || 'None';
            console.log(m);
          const resp = new EmbedBuilder()
            .setAuthor(
              {
                name: client.user?.username ?? '',
                iconURL: client.user?.avatarURL() ?? undefined,
              }
            )
            .setTitle('Lists')
            .setDescription(m.substring(0, 4096));
          msg.reply({
            embeds: [resp],
          });
          return;
        }
        default:
          const _exhaustiveSwitch: never = instruction;
      }
    });
  }
  
  private async update(id: string, list: List) {
    await this.list(id);
    await this.db?.collection(repo).doc(id).set(list.data);
  }

  private async list(list: string): Promise<List | null> {
    return await this.listService.list(list);
  } 

  private async lists(): Promise<List[]> {
    const e = await this.db?.collection(repo).get();
    if (!e) return [];
    return e.docs.map(doc => ({
      id: doc.id,
      data: doc.data() as any,
    }));
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
    (msg: string) => {
      const patterns: RegExp[] = [
        /^ls \.$/g,
        /^list \.$/g,
      ];
      if (!patterns.some(r => r.test(msg))) {
        return;
      }
      return {
        action: 'ls .',
        payload: {},
      } as Instruction;
    },
  ].find(m => m(msg.toLowerCase()))||(()=>null))(msg);
} 

type Instruction = 
{
  action: 'ls .',
  payload: {},
}
|
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