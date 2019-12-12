import { ThrottleStrategy, ThrottleStrategyService } from "./throttle";

/**
 * the options available to the consumers
 * of your strategy.
 */
interface CountThrottleOptions {
  numCallsBeforeFiringAgain: number;
}

/** 
 * This service is just a wrapper that allows you to use injected services
 * inside a throttling strategy.
 * 
 * Strategy factory for calling your function once out of every numCallsBeforeFiringAgain.
 */
export class CountThrottleStrategyService implements ThrottleStrategyService<CountThrottleOptions> {
  public getStrategy: (opts: CountThrottleOptions) => ThrottleStrategy<any> = (opts) => {
    /**
     * This class is the actual throttling strategy, 
     * where the logic goes.
     */
    class CountThrottle implements ThrottleStrategy<CountThrottleOptions> {
      private blockUntil: number = 0;
      private numCallsBeforeFiringAgain: number = 0;
      constructor(opts: CountThrottleOptions) {
        this.numCallsBeforeFiringAgain = opts.numCallsBeforeFiringAgain;
      }
      public shouldFire = () => this.blockUntil === 0;
      public recordFire = () => {
        this.blockUntil = this.numCallsBeforeFiringAgain;
      }
      public recordBlock = () => {
        this.blockUntil--;
      }
    }
    return new CountThrottle(opts);
  }
}