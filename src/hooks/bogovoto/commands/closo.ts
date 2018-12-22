import { BogoVote } from "../bogo_vote";
import { Message } from "discord.js";
import { toInt } from "../../../utils/generalUtils";
import { IOption } from "../types";

/**
 * Closes a vote and announces the winner!
 * @param bogo
 * @param msg
 * @param args 
 */
export async function closo(bogo: BogoVote, msg: Message, args: string[]) {
	if (args.length !== 1) {
		msg.reply('The usage is `/closo [issueId]`');
	}

	const issue = bogo.GetIssue(toInt(args[0]));

	if (!issue) {
		msg.reply('I\'m unsure which issue you want to vote for... :(');
		return;
	}

	const optionsVotedFor = issue.votes
		.map((vote) => issue.options.find((opt) => opt.id === vote.optionId))
		.filter((opt) => !!opt) as IOption[];

	const choiceIndex = Math.floor(Math.random() * optionsVotedFor.length);
	const winningOption = optionsVotedFor[choiceIndex];

	msg.channel.send(`Alright the votes are in! Let's see who won...`);
	msg.channel.send(`This time, it's '${winningOption.content}'`);
}