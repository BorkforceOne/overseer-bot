import { IUser } from "../../utils/User";

export interface IOption {
	id: number;
	content: string;
}

export interface IVote {
	userId: string;
	optionId: number;
}

export interface IIssue {
	id: number;
	options: IOption[];
	votes: IVote[];
}