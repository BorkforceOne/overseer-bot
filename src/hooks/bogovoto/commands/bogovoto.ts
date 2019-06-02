import { Message } from 'discord.js';

import { BogoVote } from '../bogo_vote';
import { IOption } from '../types';

/**
 * Starts a vote!
 * @param bogovote 
 * @param msg 
 * @param args 
 */
export async function bogovoto(bogovote: BogoVote, msg: Message, args: string[]) {
  // Create the options
  const options: IOption[] = args.map((option, i) => ({
    content: option,
    id: i + 1,
  }));

  const issue = bogovote.NewIssue(options);
  const optionsText = options.map((opt) => `\t${opt.id}) ${opt.content}`);

  msg.channel.send([
    'Woweee we got a neato bogo voto going on here!',
    `Issue number: ${issue.id}`,
    'Here\'s the options:\n' + optionsText.join('\n'),
    '(Vote by using `/voto issueId optionId ` or close the voto '
    + 'by using `/closo`, and get a list of open voto with `/bogolist [issueId]`)',
  ].join('\n'));
}