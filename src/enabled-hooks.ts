import { AcromeanHook } from './hooks/acromean/acromean';
import { BogoVote } from './hooks/bogovoto/bogo_vote';
import { FoogleHook } from './hooks/foogle/foogle';
import { RandomojiHook } from './hooks/randomoji/randomoji';
import { SampleHook } from './hooks/sample-hook';
import { WhatHook } from './hooks/what/what';

export const ENABLED_HOOKS = [
  SampleHook,
  BogoVote,
  FoogleHook,
  RandomojiHook,
  AcromeanHook,
  WhatHook,
];
