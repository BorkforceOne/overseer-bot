
export function toIntOrNull(n: string): number | null {
  const i = parseInt(n, 10);
  if (isNaN(i)) {
    // throw new Error(`Cannot parse '${n}' to an integer`);
    return null;
  }
  return i;
}
