/**
 * A service that returns new throttle strategies with
 * getStrategy.
 * Implement this interface when creating new 
 * ThrottleStrategy classes in case you need 
 * to inject some dependency.
 */
export interface ThrottleStrategyService<TOptions> {
  getStrategy: (opts: TOptions) => ThrottleStrategy<TOptions>;
}

/** 
 * The required methods of a throttle strategy.
 */
export interface ThrottleStrategy<T> {
  shouldFire: () => boolean;
  recordFire: () => void;
  recordBlock: () => void;
}

export type FireFunction = (...args: any[]) => any;

export interface ThrottleOpts<T extends FireFunction> {
  /** the method to call */
  fire: T;
  throttleStrategies: Array<ThrottleStrategy<any>>;
}

/**
 * Returns a new function that only calls your original function 
 * when permitted by the passed ThrottleStrategy.
 */
export const throttle = <T extends FireFunction>(opts: ThrottleOpts<T>) => {
  const {
    fire,
    throttleStrategies
  } = opts;

  const throttledFunction: FireFunction = (...args: any[]) => {
    if (throttleStrategies.some(s => s.shouldFire())) {
      throttleStrategies.forEach(s => s.recordFire());
      return fire(...args);
    } else {
      throttleStrategies.forEach(s => s.recordBlock());
    }
  };

  return throttledFunction as T;
};