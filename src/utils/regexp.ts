
export function RegexpGenerateMessage(r: RegExp, input: string, output: string): string | null {
    if (r.test(input)) {
        const m = r.exec(input);
        if (m) {
            return m[0].replace(r, output);
        }
    }
    return null;
}