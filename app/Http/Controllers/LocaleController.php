<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $locale = $request->input('locale');
        if (! in_array($locale, ['en', 'bn'], true)) {
            return response()->json(['ok' => false], 422);
        }

        session(['locale' => $locale]);

        if ($request->user()) {
            $request->user()->update(['preferred_language' => $locale]);
        }

        app()->setLocale($locale);

        return response()->json(['ok' => true, 'locale' => $locale]);
    }
}
