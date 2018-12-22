import { BogoVote, VoteCode } from "../bogo_vote";
import { Message } from "discord.js";
import { toInt } from "../../../utils/generalUtils";

/**
 * Cast a vote
 * @param bogo 
 * @param msg 
 * @param args 
 */
export async function voto(bogo: BogoVote, msg: Message, args: string[]) {
	// arg 0 is issue number
	// arg 1 is vote number

	if (args.length !== 2) {
		msg.reply('The usage is `/voto [issueId] [optionId]`');
	}

	const issueId = toInt(args[0]);
	const optionId = toInt(args[1]);

	bogo.RegisterUser({
		guid: msg.author.id,
		name: msg.author.username,
	});

	const [result, option] = bogo.CastVote(issueId, optionId, msg.author.id);

	switch (result) {
		case VoteCode.VOTED:
			msg.reply('You already voted on this issue, we will overwrite your vote.');
			msg.channel.send(`${msg.author.username} has cast their vote for '${option!.content}'`);
			break;
		case VoteCode.UNREGISTERED_USER:
			msg.reply('Darn, you were unregistered and the auto-registration didn\'t work =(');
			break;
		case VoteCode.SUCCESS:
			msg.channel.send(`${msg.author.username} has cast their vote for '${option!.content}'`);
			break;
		case VoteCode.OPTION_DNE:
			msg.reply('I\'m unsure which option you want to vote for... :(');
			break;
		case VoteCode.ISSUE_DNE:
			msg.reply('I\'m unsure which issue you want to vote for... :(');
			break;
		case VoteCode.CLOSED_ISSUE:
			msg.reply(`This issue has already been closed!`);
			break;
	}

}