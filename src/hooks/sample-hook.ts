import { Hook } from '../hook';

export class SampleHook extends Hook {
  public init() {
    const { client } = this;

    client.on("ready", () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("message", (msg) => {
      if (msg.content === "ping") {
        msg.reply("pong");
      }
    });
  }
}
