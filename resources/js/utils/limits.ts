/**
 * Plan limits use NULL to mean UNLIMITED — never zero. Rendering a null as
 * "0" would read as "none allowed", the exact opposite of what it means.
 */
export function limitLabel(value: number | null | undefined): string {
    return value === null || value === undefined ? 'Unlimited' : value.toLocaleString();
}
