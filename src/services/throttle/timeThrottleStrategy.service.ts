import { DateService } from "../core/date.service";
import { ThrottleStrategy, ThrottleStrategyService } from "./throttle";

/**
 * the options available to the consumers
 * of your strategy.
 */
interface TimeThrottleOptions {
  durationBeforeFiringAgainMs: number;
}

/**
 * This class is the actual throttling strategy, 
 * where the logic goes.
 * 
 * Strategy factory that requires durationBeforeFiringAgainMs pass
 * between each function execution.
 */
export class TimeThrottleStrategyService implements ThrottleStrategyService<TimeThrottleOptions> {
  constructor(
    private readonly dateService: DateService,
  ) {}
  
  public getStrategy: (opts: TimeThrottleOptions) => ThrottleStrategy<any> = (opts) => {
    const dateService = this.dateService;
    /**
     * This class is the actual throttling strategy, 
     * where the logic goes.
     */
    class TimeThrottle implements ThrottleStrategy<TimeThrottleOptions> {
      private blockUntil: number = 0;
      private durationBeforeFiringAgainMs: number = 0;
      constructor(opts: TimeThrottleOptions) {
        this.durationBeforeFiringAgainMs = opts.durationBeforeFiringAgainMs;
      }
      public shouldFire = () => dateService.unixMs() > this.blockUntil;
      public recordFire = () => {
        this.blockUntil = dateService.unixMs() + this.durationBeforeFiringAgainMs;
      }
      public recordBlock = () => { };
    }
    return new TimeThrottle(opts);
  }
}