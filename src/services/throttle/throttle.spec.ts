import { DateService } from "../core/date.service";
import { CountThrottleStrategyService } from "./countThrottleStrategy.service";
import { throttle, ThrottleStrategy } from "./throttle";
import { TimeThrottleStrategyService } from "./timeThrottleStrategy.service";

describe("throttle", () => {

  describe("CountThrottle", () => {
    it("throttles every other", () => {

      const strategyService = new CountThrottleStrategyService();

      const fireMock = jest.fn();
      const throttledFunction = throttle({
        fire: fireMock,
        throttleStrategies: [
          strategyService.getStrategy({
            numCallsBeforeFiringAgain: 1,
          })
        ],
      });

      throttledFunction();
      throttledFunction();
      throttledFunction();
      throttledFunction();

      expect(fireMock).toHaveBeenCalledTimes(2);
    });

    it("does not throttle", () => {

      const strategyService = new CountThrottleStrategyService();

      const fireMock = jest.fn();
      const throttledFunction = throttle({
        fire: fireMock,
        throttleStrategies: [
          strategyService.getStrategy({
            numCallsBeforeFiringAgain: 0,
          })
        ],
      });

      throttledFunction();
      throttledFunction();
      throttledFunction();
      throttledFunction();

      expect(fireMock).toHaveBeenCalledTimes(4);
    });

    it("throttles and check intermediate calls", () => {

      const strategyService = new CountThrottleStrategyService();

      const fireMock = jest.fn();
      const throttledFunction = throttle({
        fire: fireMock,
        throttleStrategies: [
          strategyService.getStrategy({
            numCallsBeforeFiringAgain: 4,
          })
        ],
      });

      throttledFunction();
      throttledFunction();
      throttledFunction();
      throttledFunction();
      throttledFunction();

      expect(fireMock).toHaveBeenCalledTimes(1);

      throttledFunction();

      expect(fireMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("TimeThrottle", () => {
    it("honors time", () => {

      // Assemble
      const unixMsMock = jest.fn();
      unixMsMock.mockReturnValue(20);

      const dateService: DateService = {
        unixMs: unixMsMock
      };

      const strategyService = new TimeThrottleStrategyService(dateService);

      const fireMock = jest.fn();
      const throttledFunction = throttle({
        fire: fireMock,
        throttleStrategies: [
          strategyService.getStrategy({
            durationBeforeFiringAgainMs: 1,
          })
        ],
      });

      // Act & Assert
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(1);
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(1);
      unixMsMock.mockReturnValue(22);
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(2);
    });

    it("throttles over time", () => {

      // Assemble
      const unixMsMock = jest.fn();
      unixMsMock.mockReturnValue(20);

      const dateService: DateService = {
        unixMs: unixMsMock
      };

      const strategyService = new TimeThrottleStrategyService(dateService);

      const fireMock = jest.fn();
      const throttledFunction = throttle({
        fire: fireMock,
        throttleStrategies: [
          strategyService.getStrategy({
            durationBeforeFiringAgainMs: 30,
          })
        ],
      });

      // Act & Assert
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(1);
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(1);
      unixMsMock.mockReturnValue(30);
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(1);
      unixMsMock.mockReturnValue(60);
      throttledFunction();
      expect(fireMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("with multiple strategies", () => {
    const failStrategy: () => ThrottleStrategy<any> = () => ({
      shouldFire: () => false,
      recordFire: () => {},
      recordBlock: () => {},
    });
    const succeedStrategy: () => ThrottleStrategy<any> = () => ({
      shouldFire: () => true,
      recordFire: () => {},
      recordBlock: () => {},
    });
    describe("does not throttle", () => {
      it("when one succeeds", () => {
        const fireMock = jest.fn();
        const throttledFunction = throttle({
          fire: fireMock,
          throttleStrategies: [
            failStrategy(),
            failStrategy(),
            succeedStrategy(),
          ],
        });

        throttledFunction();
        throttledFunction();
        throttledFunction();

        expect(fireMock).toHaveBeenCalledTimes(3);
      });
    });
    describe("throttles", () => {
      it("when none succeed", () => {
        const fireMock = jest.fn();
        const throttledFunction = throttle({
          fire: fireMock,
          throttleStrategies: [
            failStrategy(),
            failStrategy(),
            failStrategy(),
          ],
        });

        throttledFunction();
        throttledFunction();
        throttledFunction();

        expect(fireMock).toHaveBeenCalledTimes(0);
      });
    });
  });
});