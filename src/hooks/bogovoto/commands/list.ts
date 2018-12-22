import { BogoVote } from "../bogo_vote";
import { Message } from "discord.js";
import { toIntOrNull } from "../../../utils/generalUtils";
import { IssueState } from "../types";

function formatIssue(bogo: BogoVote, i: number): string {
	return `Bogo #${i}: \n` + bogo.GetIssue(i)!.options.map(op => `\t${op.id}: ${op.content}`).join('\n');
}

export async function listIssues(bogo: BogoVote, msg: Message, args: string[]) {
	if (args.length >= 1) {
		const issueId = toIntOrNull(args[0]);

		if (issueId !== null) {
			const openIssue = bogo.GetIssue(issueId);

			if (openIssue === null) {
				msg.reply('That voto doesn\'t exist!');
				return;
			}

			msg.channel.send([
				openIssue.state === IssueState.CLOSED ? 'This issue is closed.' : null,
				formatIssue(bogo, issueId),
			].join('\n'));
			return;
		}
	}

	const openIssues = bogo.GetOpenIssueIds();

	const out: string[] = openIssues.map(i => formatIssue(bogo, i));

	if (out.length === 0) {
		msg.reply('no open votes!');
		return;
	}

	out.unshift('Currently open votes:');
	msg.channel.send(out.join('\n'));
}