import { Message } from "discord.js";
import { Hook } from "../hook";

interface IUser {
  guid: string;
  name: string;
}

interface IOption {
  id: number;
  content: string;
}

interface IVote {
  user: IUser;
  optionId: number;
}

interface IIssue {
  id: number;
  options: IOption[];
  votes: IVote[];
}

export class BogoVote extends Hook {
  private issues: IIssue[] = [];
  private nextIssueId: number = 0;

  public init() {
    const { client } = this;

    client.on("message", (msg) => {
      const split = msg.content.split(" ");

      switch (split[0]) {
        case "/bogovoto":
          this.handleBogoVoto(msg, split);
          break;
        case "/voto":
          this.handleVoto(msg, split);
          break;
        case "/closo":
          this.handleCloso(msg, split);
          break;
      }
    });
  }

  private handleBogoVoto(msg: Message, split: string[]) {
    // Strip off the command part of the message
    split.shift();

    // Create the options
    const options: IOption[] = split.map((option, i) => ({
      content: option,
      id: i + 1,
    }));

    const issue: IIssue = {
      id: this.nextIssueId++,
      options,
      votes: [],
    };

    this.issues.push(issue);

    msg.channel.send("Woweee we got a neato bogo voto going on here!");

    const optionsText = options.map((opt) => `\t${opt.id}) ${opt.content}`);
    msg.channel.send("Here's the options:\n" + optionsText.join("\n"));
    msg.channel.send("(Vote by using `/voto [option number]` or close the voto by using `/closo`)");
  }

  private handleVoto(msg: Message, split: string[]) {
    // Strip off the command part of the message
    split.shift();

    const issue = this.issues[this.issues.length - 1];
    const optionId = parseInt(split[0], 10);
    const option: IOption | undefined = issue.options.find((opt) => opt.id === optionId);

    if (!option) {
      msg.reply("I'm unsure which option you want to vote for... :(");
      return;
    }

    const vote: IVote = {
      optionId: option.id,
      user: {
        guid: msg.author.id,
        name: msg.author.username,
      },
    };

    issue.votes.push(vote);

    msg.channel.send(`${msg.author.username} has cast their vote for '${option.content}'`);
  }

  private handleCloso(msg: Message, split: string[]) {
    const issue = this.issues[this.issues.length - 1];
    const optionsVotedFor = issue.votes
      .map((vote) => issue.options.find((opt) => opt.id === vote.optionId))
      .filter((opt) => !!opt) as IOption[];

    const choiceIndex = Math.floor(Math.random() * optionsVotedFor.length);
    const winningOption = optionsVotedFor[choiceIndex];

    msg.channel.send(`Alright the votes are in! Let's see who won...`);
    msg.channel.send(`This time it's '${winningOption.content}'`);
  }
}
