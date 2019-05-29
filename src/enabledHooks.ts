import { BogoVote } from './hooks/bogovoto/bogo_vote';
import { SampleHook } from './hooks/sample_hook';
import { FoogleHook } from './hooks/foogle/foogle';
import { Randomoji } from './hooks/randomoji/randomoji';
import { AcromeanHook } from './hooks/acromean/acromean';

export const enabledHooks = [
	SampleHook,
	BogoVote,
	FoogleHook,
	Randomoji,
	AcromeanHook,
];
