import { Client, RichEmbed } from 'discord.js';

import { DiscordService } from '../../services/app/discord_service';
import { Hook } from '../../utils/hook';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class VersionHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on("ready", () => {
      console.log(`Running version (${process.env.npm_package_version} - ${process.env.SOURCE_COMMIT})`);
    });

    client.on("message", async (msg) => {
      if (msg.content === "/version") {
        const baseUrl = 'https://github.com/bjg96/overseer-bot/'; // TODO use a process env?
        const commitHash = process.env.SOURCE_COMMIT;
        const version = process.env.npm_package_version;
        if (!version)
          throw new Error('No version number found!');
        const url = baseUrl + (commitHash ? 'commit/' + commitHash : '');
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        const title = $("title").text();

        const resp = new RichEmbed()
          .setTitle(title)
          .setAuthor(
            client.user.username,
            client.user.avatarURL,
          )
          .setColor(0x00AE86)
          .setDescription(
            commitHash ? 
            `Version ${version} - [${commitHash}](${url})` 
            : 
            `Version ${version}`
          );
        msg.reply(resp);
      }
    });
  }
}
