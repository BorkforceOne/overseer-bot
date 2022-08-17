import { Client, Message } from 'discord.js';

import { Hook } from '../../utils/hook';
import { StateSave } from '../../utils/state';
import { SMap } from '../../utils/types';
import { IUser } from '../../utils/User';
import { bogovoto } from './commands/bogovoto';
import { closo } from './commands/closo';
import { IIssue, IOption, IssueState, IVote } from './types';
import { DiscordService } from '../../services/app/discord_service';
import { emojiList } from '../../utils/emojiList';

/**
 * SUPER IMPORTANT:
 * register the bogovoto commands here
 */
const commands: SMap<handlerFunction> = {
    bogovoto,
    closo,
};

//#region helper stuff

type handlerFunction = (bogovote: BogoVotoHook, msg: Message, args: string[]) => Promise<void>;

export enum VoteCode {
    UNREGISTERED_USER = 'unregistered',
    ISSUE_DNE = 'issue dne',
    OPTION_DNE = 'option dne',
    VOTED = 'voted already',
    SUCCESS = 'success',
    CLOSED_ISSUE = 'closed',
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

        client.on('messageCreate', (msg) => {
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
        client.on('messageReactionAdd', (reaction, user) => {
            if (user.bot)
                return;

            if (!reaction.message.author)
                return;

            this.RegisterUser({
                guid: user.id,
            });

            if (!reaction.emoji.name)
                return;
            
            const guildEmoji = reaction.message.guild?.emojis.cache.find((em) => em.identifier === reaction.emoji.identifier);

            if (emojiList.includes(reaction.emoji.name!) || guildEmoji) {
                const { issues } = this.state.Get();
                const issue = issues.find(issue => issue.messageId === reaction.message.id);
                if (issue) {
                    const emojiId = guildEmoji?.identifier ?? reaction.emoji.name;

                    const [result, ] = this.CastVote(issue.id, emojiId, user.id);
                    
                    switch (result) { 
                        case VoteCode.UNREGISTERED_USER:
                        case VoteCode.OPTION_DNE: 
                        case VoteCode.ISSUE_DNE: 
                        case VoteCode.CLOSED_ISSUE: {
                            reaction.users.remove(user.id);
                            return; 
                        }
                        case VoteCode.VOTED: {
                            reaction.message.reactions.cache.map(react => {
                                if (react.emoji.identifier !== reaction.emoji.identifier) {
                                    return react.users.remove(user.id);
                                }
                            });
                            break;
                        }
                        case VoteCode.SUCCESS: {
                            break;
                        }
                    }

                    const lines = reaction.message.content?.split('\n') ?? [];
                    lines[1] = `Voto id ${issue.id} - ${issue.votes.length} vote${issue.votes.length !== 1 ? 's' : ''}`;
                    reaction.message.edit(lines.join('\n'));
                }
            }

        });
        client.on('messageReactionRemove', (reaction, user) => {
            if (user.bot)
                return;

            if (!reaction.message.author)
                return;

            this.RegisterUser({
                guid: user.id,
            });

            if (!reaction.emoji.name)
                return;
            
            const guildEmoji = reaction.message.guild?.emojis.cache.find((em) => em.identifier === reaction.emoji.identifier);

            if (emojiList.includes(reaction.emoji.name!) || guildEmoji) {
                const { issues } = this.state.Get();
                const issue = issues.find(issue => issue.messageId === reaction.message.id);
                if (issue) {
                    const emojiId = guildEmoji?.identifier ?? reaction.emoji.name;

                    const [result, ] = this.RemoveVote(issue.id, emojiId, user.id);
                    
                    switch (result) { 
                        case VoteCode.UNREGISTERED_USER:
                        case VoteCode.OPTION_DNE: 
                        case VoteCode.ISSUE_DNE: 
                        case VoteCode.CLOSED_ISSUE: {
                            reaction.users.remove(user.id);
                            return; 
                        }
                        case VoteCode.VOTED: {
                            reaction.message.reactions.cache.map(react => {
                                if (react.emoji.identifier !== reaction.emoji.identifier) {
                                    return react.users.remove(user.id);
                                }
                            });
                            break;
                        }
                        case VoteCode.SUCCESS: {
                            break;
                        }
                    }

                    const lines = reaction.message.content?.split('\n') ?? [];
                    lines[1] = `Voto id ${issue.id} - ${issue.votes.length} vote${issue.votes.length !== 1 ? 's' : ''}`;
                    reaction.message.edit(lines.join('\n'));
                }
            }
        });
    }

    /**
     * Starts a new issue given the options
     * @param options 
     */
    public NewIssue(options: IOption[], messageId: string, ownerId: string) {
        const { issues, nextIssueId } = this.state.Get();

        const issue: IIssue = {
            id: nextIssueId + 1,
            options,
            votes: [],
            state: IssueState.OPEN,
            messageId,
            ownerId,
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
    public CastVote(issueId: number, optionId: string, userId: string): [VoteCode, IOption?] {
        const { issues } = this.state.Get();

        const issue: IIssue | undefined = issues.find(i => i.id === issueId);
        if (!issue) return [VoteCode.ISSUE_DNE];

        if (issue.state === IssueState.CLOSED) return [VoteCode.CLOSED_ISSUE];

        const option: IOption | undefined = issue.options.find((opt) => opt.emojiId === optionId);
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
                optionId,
                userId,
            };

            issue.votes.push(vote);

            this.state.Save({
                issues,
            });

            return [VoteCode.SUCCESS, option];
        }
    }

    public RemoveVote(issueId: number, optionId: string, userId: string) {
        const { issues } = this.state.Get();

        const issue: IIssue | undefined = issues.find(i => i.id === issueId);
        if (!issue) return [VoteCode.ISSUE_DNE];

        if (issue.state === IssueState.CLOSED) return [VoteCode.CLOSED_ISSUE];

        const option: IOption | undefined = issue.options.find((opt) => opt.emojiId === optionId);
        if (!option) return [VoteCode.OPTION_DNE];

        const user = this.GetUser(userId);
        if (!user) return [VoteCode.UNREGISTERED_USER];

        const alreadyVoted = issue.votes.findIndex(vote => vote.userId === userId);
        if (alreadyVoted !== -1) {
            if (issue.votes[alreadyVoted].optionId !== optionId) {
                return [VoteCode.OPTION_DNE, option];
            }
            
            issue.votes.splice(alreadyVoted, 1);
            return [VoteCode.VOTED, option];
        }
        return [];
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
            .map((vote) => issue.options.find((opt) => opt.emojiId === vote.optionId))
            .filter((opt) => !!opt) as IOption[];

        if (optionsVotedFor.length === 0) {
            issue.state = IssueState.CLOSED;
            return [CloseCode.NO_VOTES];
        }

        const choiceIndex = Math.floor(Math.random() * optionsVotedFor.length);
        const winningOption = optionsVotedFor[choiceIndex];

        issue.result = winningOption.id;
        issue.state = IssueState.CLOSED;

        return [CloseCode.CLOSED, winningOption];
    }
}
