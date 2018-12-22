
export function toInt(n: string): number {
	const i = parseInt(n, 10);
	if (isNaN(i)) {
		throw new Error(`Cannot parse '${n}' to an integer`);
	}
	return i;
}
