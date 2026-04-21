<?php

namespace App\Services;

use App\Models\Medicine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MedicineSearchService
{
    public function search(string $query, int $limit = 20): Collection
    {
        $q = trim($query);
        if ($q === '') {
            return collect();
        }

        $cacheKey = 'med_search:' . strtolower($q) . ':' . $limit;

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($q, $limit) {
            $builder = Medicine::query()->where('is_active', true);

            $driver = DB::connection()->getDriverName();
            if ($driver === 'mysql') {
                $builder->whereRaw(
                    'MATCH(brand_name, generic_name) AGAINST (? IN BOOLEAN MODE)',
                    [$this->prepareMatchTerm($q)]
                );
            } else {
                $like = "%{$q}%";
                $builder->where(function ($qq) use ($like) {
                    $qq->where('brand_name', 'LIKE', $like)
                        ->orWhere('generic_name', 'LIKE', $like);
                });
            }

            return $builder
                ->orderByRaw("CASE WHEN brand_name LIKE ? THEN 0 ELSE 1 END", ["{$q}%"])
                ->orderBy('brand_name')
                ->limit($limit)
                ->get(['id', 'brand_name', 'generic_name', 'type', 'strength', 'manufacturer']);
        });
    }

    public function topCache(int $limit = 1000): Collection
    {
        return Cache::remember('medicines:top:' . $limit, now()->addHour(), function () use ($limit) {
            return Medicine::query()
                ->where('is_active', true)
                ->orderBy('brand_name')
                ->limit($limit)
                ->get(['id', 'brand_name', 'generic_name', 'type', 'strength', 'manufacturer']);
        });
    }

    public function invalidate(): void
    {
        Cache::forget('medicines:top:1000');
    }

    protected function prepareMatchTerm(string $q): string
    {
        $clean = preg_replace('/[+\-><\(\)~*"@]/', ' ', $q);
        $tokens = array_filter(preg_split('/\s+/', trim($clean)));

        return implode(' ', array_map(fn ($t) => $t . '*', $tokens));
    }
}
