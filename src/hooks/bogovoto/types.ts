export interface IOption {
  id: number;
  content: string;
}

export interface IVote {
  userId: string;
  optionId: number;
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
}