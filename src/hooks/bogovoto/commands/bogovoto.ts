import { GuildEmoji, Message } from 'discord.js';
import { start } from 'repl';
import { emojiList } from '../../../utils/emojiList';

import { BogoVotoHook } from '../bogovoto';
import { IOption } from '../types';

function removeSuffix(str: string, suffix: string) {
    return str.includes(suffix) ? str.substring(0, str.lastIndexOf(suffix)) : str;
}
function removePrefix(str: string, prefix: string) {
    return str.includes(prefix) ? str.substring(str.indexOf(prefix) + prefix.length) : str;
}
function escapeRegex(string: string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const enclosingTokenChoices = [
    '||',
    "'",
    '"',
    '""',
    '"""',
    '`',
    '```',
].map(x => [x, new RegExp(`^${escapeRegex(x)}([^${x[x.length - 1]}]|$)`)] as const);


function parseOptions(args: string[]) {
    const options: string[] = [];
    let enclosingToken = '';
    let currentOption: string[] = [];

    function collapseCurrentOptions() {
        if (currentOption.length > 0) {
            options.push(removeSuffix(currentOption.join(' ').trim(), enclosingToken));
            enclosingToken = '';
            currentOption = [];
        }
    }

    args.forEach(word => {
        if (enclosingToken.length > 0) {
            if (word.endsWith(enclosingToken)) {
                currentOption.push(removeSuffix(word, enclosingToken));
                collapseCurrentOptions();
            }
            else {
                currentOption.push(word);
            }
        }
        else {
            const startEnclosingToken = enclosingTokenChoices.filter(([, regex]) => regex.test(word)).map(([enc,]) => enc);
            if (startEnclosingToken.length > 0) {
                enclosingToken = startEnclosingToken[0];
                const content = removePrefix(word, enclosingToken);
                currentOption.push(content);
                if (content.endsWith(enclosingToken)) {
                    collapseCurrentOptions();
                }
            }
            else {
                options.push(word);
            }
        }
    });

    collapseCurrentOptions();

    return options;
}

/**
 * Starts a vote!
 * @param bogovote 
 * @param msg 
 * @param args 
 */
export async function bogovoto(bogovote: BogoVotoHook, msg: Message, args: string[]) {
    // Create the options
    const parsedOptions = parseOptions(args);


    const allEmojis = [
        ...emojiList,
        ...msg.guild!.emojis.cache.map((e: GuildEmoji) => e.identifier),
    ];

    const emojis = Array(allEmojis.length).fill(0).map((_, i) => i).sort((a, b) => Math.random() - 0.5).slice(0, parsedOptions.length).map(i => allEmojis[i]);
    const options: IOption[] = parsedOptions.map((option, i) => ({
        content: option,
        id: i + 1,
        emojiId: emojis[i],
    }));

    const optionsText = options.map((opt) => {
        if (emojiList.includes(opt.emojiId))
            return `\t${opt.emojiId} ) ${opt.content}`;
        return `\t<:${opt.emojiId}> ) ${opt.content}`
    });

    const contents = [
        'Woweee we got a neato bogo voto going on here!',
        'Here\'s the options:\n' + optionsText.join('\n'),
        '(Vote with the reactions below, and the owner can close the voto by using `/closo [voto id]`)',
    ];

    const message = await msg.channel.send(contents.join('\n'));

    const issue = bogovote.NewIssue(options, message.id, msg.author.id);

    contents.splice(1, 0, `Voto id ${issue.id}`);

    await message.edit(contents.join('\n'));

    await Promise.all(emojis.map(opt => message.react(opt)));
}