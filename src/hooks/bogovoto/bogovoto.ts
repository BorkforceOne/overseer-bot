import { Client, Message } from 'discord.js';

import { Hook } from '../../utils/hook';
import { StateSave } from '../../utils/state';
import { SMap } from '../../utils/types';
import { IUser } from '../../utils/User';
import { bogovoto } from './commands/bogovoto';
import { closo } from './commands/closo';
import { listIssues } from './commands/list';
import { voto } from './commands/voto';
import { IIssue, IOption, IssueState, IVote } from './types';
import { DiscordService } from '../../services/discord_service';

/**
 * SUPER IMPORTANT:
 * register the bogovoto commands here
 */
const commands: SMap<handlerFunction> = {
  bogovoto,
  voto,
  closo,
  bogolist: listIssues,
};

//#region helper stuff

type handlerFunction = (bogovote: BogoVotoHook, msg: Message, args: string[]) => Promise<void>;

export enum VoteCode {
  UNREGISTERED_USER,
  ISSUE_DNE,
  OPTION_DNE,
  VOTED,
  SUCCESS,
  CLOSED_ISSUE,
}

export enum CloseCode {
  ISSUE_DNE,
  CLOSED,
  ALREADY_CLOSED,
  NO_VOTES,
}

interface IState {
  issues: IIssue[];
  nextIssueId: number;
}

//#endregion

/**
 * Runs a voting application
 */
export class BogoVotoHook implements Hook {
  private users: IUser[] = [];

  private state = new StateSave<IState>({
    issues: [],
    nextIssueId: 0,
  });

  private readonly client: Client;

  constructor(private readonly discordService: DiscordService) {
    this.client = this.discordService.getClient();
  }

  async init() {
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
        handler(this, msg, split.slice(1)).then().catch();
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
      state: IssueState.OPEN,
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

  public GetOpenIssueIds() {
    const { issues } = this.state.Get();
    return issues.filter(i => i.state === IssueState.OPEN)
      .map(i => i.id);
  }

	/**
	 * Registers a user to vote
	 * @param user 
	 */
  public RegisterUser(user: IUser) {
    const existing = this.users.find(u => u.guid === user.guid);
    if (!existing) {
      this.users.push({ ...user });
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

    if (issue.state === IssueState.CLOSED) return [VoteCode.CLOSED_ISSUE];

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

  public CloseIssue(issueId: number): [CloseCode, IOption?] {
    const { issues } = this.state.Get();

    const issue: IIssue | undefined = issues.find(i => i.id === issueId);
    if (!issue) return [CloseCode.ISSUE_DNE];

    if (issue.state === IssueState.CLOSED) {
      const winningOption = issue.options.find(o => o.id === issue.result);
      return [CloseCode.ALREADY_CLOSED, winningOption];
    }

    const optionsVotedFor = issue.votes
      .map((vote) => issue.options.find((opt) => opt.id === vote.optionId))
      .filter((opt) => !!opt) as IOption[];

    if (optionsVotedFor.length === 0) {
      return [CloseCode.NO_VOTES];
    }

    const choiceIndex = Math.floor(Math.random() * optionsVotedFor.length);
    const winningOption = optionsVotedFor[choiceIndex];

    issue.result = winningOption.id;
    issue.state = IssueState.CLOSED;

    return [CloseCode.CLOSED, winningOption];
  }
}
