export interface DateService {
  /** 
   * returns current time in milliseconds
   * since Unix epoch
   */
  unixMs: () => number;
}

export class DateService implements DateService {
  constructor() {}

  unixMs = () => new Date().getTime();
}
