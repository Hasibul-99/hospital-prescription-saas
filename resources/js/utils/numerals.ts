/**
 * Convert any Bangla numerals (০-৯) in a string or number to English (0-9).
 * Non-numeric characters pass through unchanged. Used on the print path so
 * every prescription reads the same at every pharmacy counter regardless of
 * what the doctor typed.
 */
const BN_TO_EN: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function toEnglishNumerals(input: string | number | null | undefined): string {
    if (input === null || input === undefined) return '';
    const s = typeof input === 'number' ? String(input) : input;
    return s.replace(/[০-৯]/g, (d) => BN_TO_EN[d] ?? d);
}
