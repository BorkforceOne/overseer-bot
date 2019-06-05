/**
 * Hook optional life-cycle functions.
 */
export interface Hook {
  /**
   * Called during hook initialization.
   */
  init(): Promise<void>;
}
