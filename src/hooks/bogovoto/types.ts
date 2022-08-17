export interface IOption {
  id: number;
  content: string;
  emojiId: string;
}

export interface IVote {
  userId: string;
  optionId: string;
}


export enum IssueState {
  OPEN = 1,
  CLOSED = 2,
}
export interface IIssue {
  id: number;
  options: IOption[];
  votes: IVote[];
  state: IssueState;
  result?: number;
  messageId: string;
  ownerId: string;
}