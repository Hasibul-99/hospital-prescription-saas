<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Durable global key/value settings (platform name, logo, etc.).
 *
 * The database row is the source of truth; the cache is only a read
 * accelerator. A `cache:clear` (or a volatile driver flush) drops the cached
 * value but the row survives, so the next read repopulates it — unlike the
 * previous cache-only storage, which lost the setting entirely on flush.
 */
class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value'];

    private static function cacheKey(string $key): string
    {
        return "platform_setting:{$key}";
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = Cache::rememberForever(
            self::cacheKey($key),
            fn () => static::query()->where('key', $key)->value('value')
        );

        return $value ?? $default;
    }

    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget(self::cacheKey($key));
    }

    public static function forget(string $key): void
    {
        static::where('key', $key)->delete();
        Cache::forget(self::cacheKey($key));
    }
}
