import { BogoVote, CloseCode } from "../bogo_vote";
import { Message } from "discord.js";
import { toInt } from "../../../utils/generalUtils";

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

	const [closeCode, winningOption] = bogo.CloseIssue(issue.id);

	switch (closeCode) {
		case CloseCode.ALREADY_CLOSED:
			msg.reply(`This bogovoto has already been closed, with the result: '${winningOption!.content}'`);
			return;
		case CloseCode.ISSUE_DNE:
			msg.reply('That bogovote doesn\'t exist, silly!');
			return;
		case CloseCode.CLOSED:
			msg.channel.send(`Alright the votes are in! Let's see who won...`);
			msg.channel.send(`This time, it's '${winningOption!.content}'`);
			break;
	}
}