import { Hook } from "../../hook";
import { Message } from "discord.js";
import axios from "axios";

const API = "https://api.datamuse.com/words";
const MAX_RESULTS = 1000;
const ACRO_REGEX = new RegExp("^[A-Z]+$");
const CACHE: any = {};
const MAX_RESULTS_PER_MSG = 1;

/** Fake Google that just LMGTFYs whatever you look up */
/** This hook is not associated with Google in any way */
export class AcromeanHook extends Hook {
    public init() {
        const { client } = this;

        client.on("message", (msg) => {
            if (msg.member.user.bot === false) {
                let timesRan = 0;
                const splits = msg.content.split(' ');
                for (const split of splits) {
                    if (split.length > 1 && split.match(ACRO_REGEX)) {
                        if (timesRan < MAX_RESULTS_PER_MSG) {
                            this.reply(split, msg);
                            timesRan ++;
                        }
                    }
                }
            }
        });
    }

    reply(acro: string, msg: Message) {
        const promises = [];
        const types: string[] = [];
        for (let i = 0; i < acro.length; i++) {
            promises.push(getForLetter(acro[i]));
            if (i === 0) {
                types.push('v');
            } else if (i < acro.length - 1) {
                types.push('adj');
            } else {
                types.push('n');
            }
        }
        Promise.all(promises).then(results => {
            const finalWords = [];
            for (const data of results) {
                const type = types.shift();
                const filtered = (data as any[]).filter(d => d.tags && d.tags.indexOf(type) > -1);
                finalWords.push(sentenceCase(choose<any>(filtered).word));
            }
            msg.channel.send(`${acro} (${finalWords.join(' ')})`);
        });
    }
}

async function getForLetter(letter: string) {
    if (CACHE[letter]) {
        return CACHE[letter];
    }
    const url = `${API}?sp=${letter}*&md=p&max=${MAX_RESULTS}`;
    const result = await axios.get(url);
    const { data } = result;
    CACHE[letter] = data;
    return data;
}

function choose<E>(input: E[]): E {
    return input[Math.round(Math.random() * input.length)];
}

function sentenceCase(input: string) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}