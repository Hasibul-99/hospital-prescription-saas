<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorMedicineDefault;
use App\Models\Medicine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorMedicineDefaultController extends Controller
{
    public function show(Request $request, Medicine $medicine): JsonResponse
    {
        $default = DoctorMedicineDefault::query()
            ->where('doctor_id', $request->user()->id)
            ->where('medicine_id', $medicine->id)
            ->first();

        return response()->json(['default' => $default]);
    }

    public function store(Request $request, Medicine $medicine): JsonResponse
    {
        $data = $request->validate([
            'dose_morning' => ['nullable', 'numeric', 'min:0'],
            'dose_noon' => ['nullable', 'numeric', 'min:0'],
            'dose_afternoon' => ['nullable', 'numeric', 'min:0'],
            'dose_night' => ['nullable', 'numeric', 'min:0'],
            'dose_bedtime' => ['nullable', 'numeric', 'min:0'],
            'timing' => ['nullable', 'in:before_meal,after_meal,empty_stomach,with_food,custom'],
            'duration_value' => ['nullable', 'integer', 'min:0'],
            'duration_unit' => ['nullable', 'in:days,weeks,months,years,continue,N_A'],
            'custom_instruction' => ['nullable', 'string', 'max:500'],
        ]);

        $default = DoctorMedicineDefault::updateOrCreate(
            [
                'doctor_id' => $request->user()->id,
                'medicine_id' => $medicine->id,
            ],
            $data
        );

        return response()->json(['default' => $default]);
    }

    public function destroy(Request $request, Medicine $medicine): JsonResponse
    {
        DoctorMedicineDefault::where('doctor_id', $request->user()->id)
            ->where('medicine_id', $medicine->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
