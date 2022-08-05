import { APIEmbedField, Client, EmbedBuilder } from "discord.js";
import { DiscordService } from "../../services/app/discord_service";
import { Hook } from "../../utils/hook";
import { ENABLED_HOOKS } from "../..";
import { read, resolve } from "../../utils/general";

const toHookName = (hook: string) => 
  hook.toLowerCase().split('hook')[0];

const getHookMeta = (_msg: string) => {
  const msg = _msg.toLowerCase();
  const n = ENABLED_HOOKS.length;
  const hook = ENABLED_HOOKS
    .map(h => h.toLowerCase())
    .map(toHookName)
    .reverse()
    .find((v, i) =>
      msg.includes(n - i - 1 + '')
      ||
      msg.includes(v)
    );
  if (!hook)
    return null;
  const hookname = hook.toLowerCase().split('hook')[0];
  const hookpath = `/bjg96/overseer-bot/blob/master/src/hooks/${hookname}/${hookname}.ts`;
  const url = `https://github.com` + hookpath;
  const contentsPath = process.env.NODE_ENV === 'development' ?
    `../hooks/${hookname}/${hookname}.ts`
    :
    `../../src/hooks/${hookname}/${hookname}.ts`;
  const contents = read(contentsPath);
  const code = `
\`\`\`typescript
${contents?.split(' in'+'it() {')[1].slice(0, 1950)}
\`\`\`
        `;
  return {
    contentsPath: resolve(contentsPath),
    hook,
    hookname,
    hookpath,
    code,
    url,
  };
};

export class InfoHook implements Hook {
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

      if (this.matchHook(msg.content)) {
        const meta = getHookMeta(msg.content);
        if (!meta) {
          msg.reply('Hook not found');
          return;
        }
        const { hookname, url, contentsPath, hook } = meta;
        const resp = new EmbedBuilder()
          .setAuthor(
            {
              name: client.user?.username ?? '',
              iconURL: client.user?.avatarURL() ?? undefined,
            }
          )
          .setTitle(hookname)
          .setDescription(`Here is info on ${hookname}.`)
          .setURL(url)
          .addFields([
            {name: 'Source', value: url},
            {name: 'Code Preview', value: `Type \`code ${hook}\`.`},
          ])
          .setColor(0x00AE86);
        msg.reply({
          embeds: [resp],
        });
        return;
      }

      if (this.matchSource(msg.content)) {
        const meta = getHookMeta(msg.content);
        if (!meta) {
          msg.reply('Hook not found');
          return;
        }
        const { code} = meta;
        msg.reply(code);
        return;
      }

      if (this.match(msg.content)) {
        const resp = new EmbedBuilder()
          .setAuthor(
            {
              name: client.user?.username ?? "",
              iconURL: client.user?.avatarURL() ?? undefined,
            }
          )
          .setColor(0x00AE86)
          .setDescription('You asked for info on Overseer. Here are the registered hooks. Type `hook 0` or `hook acromean` to see more info on that hook.')
        ;
        const hooks: APIEmbedField[] = [];
        ENABLED_HOOKS.forEach((h, i) => {
          const hookname = h.toLowerCase().split('hook')[0];
          hooks.push({
            name: `${i}`,
            value: hookname,
            inline: true,
          });
        });
        resp.addFields(hooks);
        msg.reply({
          embeds: [resp],
        });
        return;
      } 
    });
  }

  public match = (msg: string) => [
    (msg: string) => {
      if (!msg.includes('overseer'))
        return false;
      return [
        'about',
        'man',
        'help',
        '--help',
        '-h',
        'info',
      ].some(m => msg.includes(m));
    },
    (msg: string) => {
      const patterns: RegExp[] = [
        /^about$/g,
        /^man$/g,
        /^help$/g,
        /^--help$/g,
        /^-h$/g,
        /^info$/g,
      ];
      return patterns.some(r => r.test(msg));
    },
  ].some(m => m(msg.toLowerCase()));

  public matchHook = (msg: string) => [
    (msg: string) => {
      const patterns: RegExp[] = [
        /^hook\s*\d+/g,
        /^hook\s*\w+Hook/g,
      ];
      return patterns.some(r => r.test(msg));
    },
  ].some(m => m(msg));

  public matchSource = (msg: string) => [
    (msg: string) => {
      const patterns: RegExp[] = [
        /^source/g,
        /^source\s*\w+Hook/g,
        /^code/g,
        /^code\s*\w+Hook/g,
      ];
      return patterns.some(r => r.test(msg));
    },
  ].some(m => m(msg));
}
