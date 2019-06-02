import { Hook } from '../../hook';

const CACHE: any = {};

export class WhatHook extends Hook {
  public init() {
    const { client } = this;

    client.on("message", (msg) => {
      if (msg.member.user.bot === false) {
        if (msg.content !== 'WHAT') {
          CACHE[msg.channel.id] = msg.content;
        } else if (CACHE[msg.channel.id]) {
          msg.reply(`they said "${CACHE[msg.channel.id].toUpperCase()}"`);
        }
      }
    });
  }
}
