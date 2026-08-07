<?php

namespace App\Support;

use App\Models\PlatformSetting;

/**
 * Currency resolution and server-side money formatting.
 *
 * Two independent currencies exist in this app and they must not be conflated:
 *
 *   - The PLATFORM BASE currency (platform_settings key `platform.currency`)
 *     prices subscription plans and the public landing page.
 *   - A HOSPITAL's own currency (hospitals.currency) renders everything inside
 *     the tenant — consultation fees, chamber fees, daily statements.
 *
 * There is no conversion between them. See config/currencies.php.
 */
class Money
{
    public const PLATFORM_CURRENCY_KEY = 'platform.currency';

    /** The super admin's chosen base currency for plan pricing. */
    public static function platformCurrency(): string
    {
        $code = PlatformSetting::get(self::PLATFORM_CURRENCY_KEY);

        return self::isSupported($code) ? $code : self::fallbackCurrency();
    }

    public static function fallbackCurrency(): string
    {
        return config('currencies.default', 'BDT');
    }

    public static function isSupported(?string $code): bool
    {
        return $code !== null && array_key_exists($code, config('currencies.supported', []));
    }

    public static function supported(): array
    {
        return config('currencies.supported', []);
    }

    /**
     * Display config for a currency code, always resolvable. Unknown or null
     * codes fall back to the platform currency, then the configured default.
     *
     * @return array{code:string,symbol:string,name:string,decimals:int,position:string}
     */
    public static function config(?string $code = null): array
    {
        $code = self::isSupported($code) ? $code : self::platformCurrency();
        $supported = self::supported();

        $definition = $supported[$code] ?? $supported[self::fallbackCurrency()] ?? [
            'symbol' => '',
            'name' => $code,
            'decimals' => 2,
            'position' => 'before',
        ];

        return ['code' => $code] + $definition;
    }

    /**
     * Format an amount for display, e.g. `৳ 1,000.00` or `1,000.00 kr`.
     *
     * Accepts strings because Laravel serialises decimal columns as strings.
     */
    public static function format(float|int|string|null $amount, ?string $code = null): string
    {
        $config = self::config($code);
        $number = number_format((float) ($amount ?? 0), $config['decimals'], '.', ',');

        return $config['position'] === 'after'
            ? "{$number} {$config['symbol']}"
            : "{$config['symbol']} {$number}";
    }
}
