import { Message } from 'discord.js';

import { toIntOrNull } from '../../../utils/general';
import { BogoVotoHook, CloseCode } from '../bogovoto';

/**
 * Closes a vote and announces the winner!
 * @param bogo
 * @param msg
 * @param args 
 */
export async function closo(bogo: BogoVotoHook, msg: Message, args: string[]) {
    if (args.length !== 1) {
        msg.reply('The usage is `/closo [voto id]`');
        return;
    }

    const issueId = toIntOrNull(args[0]);

    if (issueId === null) {
        return;
    }

    const issue = bogo.GetIssue(issueId);

    if (!issue) {
        return;
    }

    if (msg.author.id !== issue.ownerId) {
        return;
    }

    const [closeCode, winningOption] = bogo.CloseIssue(issue.id);

    switch (closeCode) {
        case CloseCode.ALREADY_CLOSED: {
            if (winningOption) {
                msg.reply(`This bogovoto has already been closed, with the result: '${winningOption.content}'`);
            }
            else {
                msg.reply('This bogovoto was already closed with no votes.');
            }
            break;
        }
        case CloseCode.ISSUE_DNE: {
            msg.reply('That bogovote doesn\'t exist!');
            break;
        }
        case CloseCode.CLOSED: {
            msg.channel.send(`Alright the votes are in! Let's see who won...\nThis time, it's '${winningOption!.content}'`);
            break;
        }
        case CloseCode.NO_VOTES: {
            msg.reply('Closed with no votes.');
            break;
        }
    }
}