import { ThrottleStrategy, ThrottleStrategyService } from "./throttle";

/**
 * chance: a number (ideally) between 0 and 1
 */
interface RandomThrottleOptions {
  chance: number;
}

/** 
 * This service is just a wrapper that allows you to use injected services
 * inside a throttling strategy.
 * 
 * Strategy factory for calling your function once out of every numCallsBeforeFiringAgain.
 */
export class RandomThrottleStrategyService implements ThrottleStrategyService<RandomThrottleOptions> {
  public getStrategy: (opts: RandomThrottleOptions) => ThrottleStrategy<any> = (opts) => {
    /**
     * This class is the actual throttling strategy, 
     * where the logic goes.
     */
    class RandomThrottle implements ThrottleStrategy<RandomThrottleOptions> {
      private chance: number = 0;
      constructor(opts: RandomThrottleOptions) {
        this.chance = opts.chance;
      }
      public shouldFire = () => Math.random() < this.chance;
      public recordFire = () => {
      }
      public recordBlock = () => {
      }
    }
    return new RandomThrottle(opts);
  }
}