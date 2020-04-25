
import { isObject } from 'util'; 
import * as fs from 'fs';
import * as path from 'path';

export function toIntOrNull(n: string): number | null {
  const i = parseInt(n, 10);
  if (isNaN(i)) {
    // throw new Error(`Cannot parse '${n}' to an integer`);
    return null;
  }
  return i;
} 

export type Complete<T> = { [P in keyof T]-?: NonNullable<T[P]>};

export const not =
  <T>(predicate: (o: T) => boolean) =>
    (o: T) => !predicate(o);

export const initConfig = <T>(config: T): Complete<T> => {
  const warnings: string[] = [];
  const validate = (path: string, o: any) => {
    Object.keys(o).forEach(key => {
      const val = o[key];
      if (isObject(val)) {
        validate(path ? `${path}.${key}` : key, val);
      }
      if (val === '' || val === undefined) {
        warnings.push(`Could not load configuration for '${key}'.`);
      }
    });
  }
  validate('', config);
  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn(warning));
    throw new Error('Some configuration variables could not be loaded. Exiting.');
  }
  return config as any;
}

export const resolve = (t: string) => path.resolve(__dirname, t);
export const exists = (t: string) => fs.existsSync(resolve(t));
export const read = (t: string) => exists(t) ? fs.readFileSync(resolve(t), 'utf-8') : null;