<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorFrequentMedicine;
use App\Models\Medicine;
use App\Services\MedicineSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public const FREQUENT_CAP = 50;

    public function __construct(private readonly MedicineSearchService $search)
    {
    }

    public function searchAction(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $q = (string) $request->input('q', '');
        $limit = (int) $request->input('limit', 20);

        return response()->json([
            'results' => $this->search->search($q, $limit),
        ]);
    }

    public function frequent(Request $request): JsonResponse
    {
        $doctorId = $request->user()->id;

        $rows = DoctorFrequentMedicine::query()
            ->where('doctor_id', $doctorId)
            ->orderBy('sort_order')
            ->with('medicine:id,brand_name,generic_name,type,strength,manufacturer')
            ->get()
            ->map(fn ($f) => $f->medicine)
            ->filter()
            ->values();

        return response()->json(['results' => $rows]);
    }

    public function addFrequent(Request $request, Medicine $medicine): JsonResponse
    {
        $doctorId = $request->user()->id;

        $count = DoctorFrequentMedicine::where('doctor_id', $doctorId)->count();
        $existing = DoctorFrequentMedicine::where('doctor_id', $doctorId)
            ->where('medicine_id', $medicine->id)
            ->first();

        if (! $existing && $count >= self::FREQUENT_CAP) {
            return response()->json([
                'message' => 'Frequent medicines cap reached (50). Remove one first.',
            ], 422);
        }

        if (! $existing) {
            DoctorFrequentMedicine::create([
                'doctor_id' => $doctorId,
                'medicine_id' => $medicine->id,
                'sort_order' => $count,
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function removeFrequent(Request $request, Medicine $medicine): JsonResponse
    {
        DoctorFrequentMedicine::where('doctor_id', $request->user()->id)
            ->where('medicine_id', $medicine->id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    public function storeMissing(Request $request): JsonResponse
    {
        $data = $request->validate([
            'brand_name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:50'],
            'strength' => ['nullable', 'string', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
        ]);

        $medicine = Medicine::create([
            ...$data,
            'is_active' => true,
        ]);

        $this->search->invalidate();

        return response()->json([
            'medicine' => $medicine->only(['id', 'brand_name', 'generic_name', 'type', 'strength', 'manufacturer']),
        ]);
    }
}
