import { Hook } from '../../hook';

const lmgtfyTemplate = "https://lmgtfy.com/?q=";
const hotword = '@google';
const responses = [
  "Here's what I found",
  "This is what I can find",
];

/** Fake Google that just LMGTFYs whatever you look up */
/** This hook is not associated with Google in any way */
export class FoogleHook extends Hook {
  public init() {
    const { client } = this;

    client.on("message", (msg) => {
      if (msg.content.indexOf(hotword) === 0) {
        const toEncode = msg.content.slice(hotword.length).trim();
        if (toEncode.length === 0)
          return;
        const encodedURI = encodeURIComponent(toEncode);
        const response = responses[Math.floor(Math.random() * responses.length)];
        msg.reply({
          embed: {
            description: `[${response}](${lmgtfyTemplate}${encodedURI})`,
          },
        });
      }
    });
  }
}
