import { Message } from "discord.js";
import { ThrottleStrategy, ThrottleStrategyService } from "./throttle";

interface RequiredFireFunctionParams {
  message: Message;
}

export interface OnOffOpts {
  userId: string;
  hookId: string;
}

/**
 * the options available to the consumers
 * of your strategy.
 */
interface FuckOffThrottleOptions {
  /** the id for the hook this throttle applies to */
  hookId: string;
  /** whether or not a bot was told to fuck off */
  shouldFire: (opts: OnOffOpts) => boolean;
}

/** 
 * This service is just a wrapper that allows you to use injected services
 * inside a throttling strategy.
 * 
 * Strategy factory for calling your function only if the user
 * didn't tell the bot to fuck off.
 */
export class FuckOffThrottleStrategyService<TFireFunctionParams extends RequiredFireFunctionParams>
  implements ThrottleStrategyService<FuckOffThrottleOptions, TFireFunctionParams> {
  public getStrategy: (opts: FuckOffThrottleOptions)
    => ThrottleStrategy<TFireFunctionParams> = (opts) => {
    /**
     * This class is the actual throttling strategy, 
     * where the logic goes.
     */
    class FuckOffThrottle implements ThrottleStrategy<TFireFunctionParams> {
      private isActive: (opts: OnOffOpts) => boolean;
      private hookId: string;
      constructor(opts: FuckOffThrottleOptions) {
        this.isActive = opts.shouldFire;
        this.hookId = opts.hookId;
      }
      public shouldFire = (params: TFireFunctionParams) => this.isActive({
        hookId: this.hookId,
        userId: params.message.author.username,
      })
      public recordFire = (params: TFireFunctionParams) => ({});
      public recordBlock = (params: TFireFunctionParams) => ({});
    }
    return new FuckOffThrottle(opts);
  }
}