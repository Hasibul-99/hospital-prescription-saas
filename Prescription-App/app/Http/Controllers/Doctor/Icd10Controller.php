<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Icd10Code;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class Icd10Controller extends Controller
{
    /**
     * Typeahead search over ICD-10 codes.
     * Matches code prefix OR title substring (case-insensitive).
     * Returns at most 20 rows. Empty query returns most-common (chapter Z00).
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $query = Icd10Code::query()->orderBy('code');

        if ($q !== '') {
            $like = str_replace(['%', '_'], ['\%', '\_'], $q);
            $query->where(function ($qq) use ($like) {
                $qq->where('code', 'like', "{$like}%")
                    ->orWhere('title', 'like', "%{$like}%");
            });
        }

        $rows = $query->limit(20)->get(['code', 'title', 'chapter']);

        return response()->json(['data' => $rows]);
    }
}
