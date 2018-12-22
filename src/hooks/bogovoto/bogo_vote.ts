import { Message, Client } from 'discord.js';
import { Hook } from '../../hook';
import { IIssue, IOption, IVote } from './types';
import { SMap } from '../../utils/utilTypes';
import { bogovoto } from './commands/bogovoto';
import { voto } from './commands/voto';
import { IUser } from '../../utils/User';
import { StateSave } from '../../utils/state';
import { closo } from './commands/closo';

/**
 * SUPER IMPORTANT:
 * register the bogovoto commands here
 */
const commands: SMap<handlerFunction> = {
	bogovoto,
	voto,
	closo,
};

//#region helper stuff

type handlerFunction = (bogovote: BogoVote, msg: Message, args: string[]) => Promise<void>;

export enum VoteCode {
	UNREGISTERED_USER,
	ISSUE_DNE,
	OPTION_DNE,
	VOTED,
	SUCCESS,
}

interface IState {
	issues: IIssue[];
	nextIssueId: number;
}

//#endregion

/**
 * Runs a voting application
 */
export class BogoVote extends Hook {
	private users: IUser[] = [];

	private state: StateSave<IState>;

	constructor(client: Client) {
		super(client);

		this.state = new StateSave<IState>({
			issues: [],
			nextIssueId: 0,
		});
	}

	public init() {
		const { client } = this;

		client.on('message', (msg) => {
			const split = msg.content.split(' ');

			const command = split[0];

			if (command === undefined) {
				return;
			}

			if (command.startsWith('/') === false) {
				return;
			}

			const handler = commands[command.substr(1)];

			if (handler) {
				handler(this, msg, split.slice(1)).then();
			}
		});
	}
	
	/**
	 * Starts a new issue given the options
	 * @param options 
	 */
	public NewIssue(options: IOption[]) {
		const { issues, nextIssueId } = this.state.Get();

		const issue: IIssue = {
			id: nextIssueId + 1,
			options,
			votes: [],
		};
	
		issues.push(issue);

		this.state.Save({
			issues,
			nextIssueId: nextIssueId + 1,
		});

		return issue;
	}

	/**
	 * Gets an issue by id
	 * @param issueId 
	 */
	public GetIssue(issueId: number) {
		const { issues } = this.state.Get();

		const existing = issues.find(u => u.id === issueId);
		return existing || null;
	}

	/**
	 * Registers a user to vote
	 * @param user 
	 */
	public RegisterUser(user: IUser) {
		const existing = this.users.find(u => u.guid === user.guid);
		if (!existing) {
			this.users.push({ ... user });
		}
	}

	/**
	 * Gets the user's voter registration
	 * @param userId 
	 */
	public GetUser(userId: string) {
		const user = this.users.find(u => u.guid === userId);
		return user || null;
	}

	/**
	 * Casts a vote for the user.
	 * see: http://fwllp.com/wp-content/uploads/2016/12/Decal-I-Voted-oval-sticker.jpg
	 * @param issueId 
	 * @param optionId 
	 * @param userId 
	 */
	public CastVote(issueId: number, optionId: number, userId: string): [VoteCode, IOption?] {
		const { issues } = this.state.Get();

		const issue: IIssue | undefined = issues.find(i => i.id === issueId);
		if (!issue) return [VoteCode.ISSUE_DNE];

		const option: IOption | undefined = issue.options.find((opt) => opt.id === optionId);
		if (!option) return [VoteCode.OPTION_DNE];

		const user = this.GetUser(userId);
		if (!user) return [VoteCode.UNREGISTERED_USER];

		const alreadyVoted = issue.votes.find(vote => vote.userId === userId);
		if (alreadyVoted) {
			alreadyVoted.optionId = optionId; // TODO: state?!?!

			this.state.Save({
				issues,
			});

			return [VoteCode.VOTED, option];
		}
		else {
			const vote: IVote = {
				optionId: option.id,
				userId,
			};
	
			issue.votes.push(vote);

			this.state.Save({
				issues,
			});
	
			return [VoteCode.SUCCESS, option];
		}
	}
}
