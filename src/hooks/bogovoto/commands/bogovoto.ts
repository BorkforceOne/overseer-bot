import { Message } from "discord.js";
import { BogoVote } from "../bogo_vote";
import { IOption, IIssue } from "../types";

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

	msg.channel.send('Woweee we got a neato bogo voto going on here!');

	const optionsText = options.map((opt) => `\t${opt.id}) ${opt.content}`);
	msg.channel.send(`Issue number: ${issue.id}`);
	msg.channel.send('Here\'s the options:\n' + optionsText.join('\n'));
	msg.channel.send('(Vote by using `/voto [issue number] [option number]` or close the voto by using `/closo`)');
}