import { usePage } from '@inertiajs/react';
import type { CurrencyConfig, PageProps } from '@/types';

/**
 * Money formatting for the whole app.
 *
 * The currency comes from the shared Inertia `currency` prop: inside a tenant
 * it is the hospital's own currency, elsewhere the platform base currency. This
 * is display only — nothing here converts between currencies.
 */

const FALLBACK: CurrencyConfig = {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    decimals: 2,
    position: 'before',
};

/**
 * Format an amount with its currency symbol, e.g. `৳ 1,200.00`.
 *
 * Accepts strings because Laravel serialises decimal columns as strings — a
 * bare `.toFixed()` on those throws, which is what several call sites used to do.
 */
export function formatMoney(
    amount: number | string | null | undefined,
    currency?: CurrencyConfig | null,
    options: { decimals?: number } = {},
): string {
    const c = currency ?? FALLBACK;
    const value = Number(amount ?? 0);
    const safe = Number.isFinite(value) ? value : 0;
    const decimals = options.decimals ?? c.decimals;

    const number = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(safe);

    // Symbol is applied manually rather than via Intl's `style: 'currency'`,
    // which renders "BDT" instead of "৳" in most locales.
    return c.position === 'after' ? `${number} ${c.symbol}` : `${c.symbol} ${number}`;
}

/** Just the number, no symbol — for table cells that carry the unit in the header. */
export function formatAmount(
    amount: number | string | null | undefined,
    currency?: CurrencyConfig | null,
    options: { decimals?: number } = {},
): string {
    const c = currency ?? FALLBACK;
    const value = Number(amount ?? 0);
    const safe = Number.isFinite(value) ? value : 0;

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: options.decimals ?? c.decimals,
        maximumFractionDigits: options.decimals ?? c.decimals,
    }).format(safe);
}

/** The active currency config from shared Inertia props. */
export function useCurrency(): CurrencyConfig {
    const { currency } = usePage<PageProps>().props;
    return currency ?? FALLBACK;
}

/** `formatMoney` pre-bound to the active currency. */
export function useMoney() {
    const currency = useCurrency();
    return (amount: number | string | null | undefined, options?: { decimals?: number }) =>
        formatMoney(amount, currency, options);
}

export { FALLBACK as fallbackCurrency };
