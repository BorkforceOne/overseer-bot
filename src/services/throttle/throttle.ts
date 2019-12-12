/**
 * A service that returns new throttle strategies with
 * getStrategy.
 * Implement this interface when creating new 
 * ThrottleStrategy classes in case you need 
 * to inject some dependency.
 */
export interface ThrottleStrategyService<TOptions, TFireFunctionParams = any> {
  getStrategy: (opts: TOptions) => ThrottleStrategy<TFireFunctionParams>;
}

/** 
 * The required methods of a throttle strategy.
 */
export interface ThrottleStrategy<TFireFunctionParams> {
  shouldFire: (opts: TFireFunctionParams) => boolean;
  recordFire: (opts: TFireFunctionParams) => void;
  recordBlock: (opts: TFireFunctionParams) => void;
}

export type FireFunction<T> = (opts: T) => any;

export interface ThrottleOpts<TFireFunctionParams> {
  /** the method to call */
  fire: FireFunction<TFireFunctionParams>;
  throttleStrategies: Array<ThrottleStrategy<TFireFunctionParams>>;
}

/**
 * Returns a new function that only calls your original function 
 * when permitted by the passed ThrottleStrategy.
 */
export const throttle = <T>(opts: ThrottleOpts<T>) => {
  const {
    fire,
    throttleStrategies
  } = opts;

  const throttledFunction: FireFunction<T> = (opts: T) => {
    if (throttleStrategies.some(s => s.shouldFire(opts))) {
      throttleStrategies.forEach(s => s.recordFire(opts));
      return fire(opts);
    } else {
      throttleStrategies.forEach(s => s.recordBlock(opts));
    }
  };

  return throttledFunction;
};