import { Hook } from '../../utils/hook';
import { DiscordService } from '../../services/discord_service';
import { Client } from 'discord.js';

const CACHE: any = {};

export class WhatHook implements Hook {
  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
    const { client } = this;

    client.on("message", (msg) => {
      if (msg.channel.type === 'text') {
        if (msg.member.user.bot === false) {
          if (msg.content !== 'WHAT') {
            CACHE[msg.channel.id] = msg.content;
          } else if (CACHE[msg.channel.id]) {
            msg.channel.send(`${CACHE[msg.channel.id].toUpperCase()}`);
          }
        }
      }
    });
  }
}
