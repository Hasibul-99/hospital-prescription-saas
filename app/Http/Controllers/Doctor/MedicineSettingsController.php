<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorFrequentMedicine;
use App\Models\DoctorMedicineDefault;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineSettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $frequent = DoctorFrequentMedicine::query()
            ->where('doctor_id', $user->id)
            ->with('medicine:id,brand_name,generic_name,type,strength,manufacturer')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'sort_order' => $f->sort_order,
                'medicine' => $f->medicine,
            ])
            ->values();

        $defaults = DoctorMedicineDefault::query()
            ->where('doctor_id', $user->id)
            ->with('medicine:id,brand_name,generic_name,type,strength')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'medicine' => $d->medicine,
                'dose_morning' => $d->dose_morning,
                'dose_noon' => $d->dose_noon,
                'dose_afternoon' => $d->dose_afternoon,
                'dose_night' => $d->dose_night,
                'dose_bedtime' => $d->dose_bedtime,
                'timing' => $d->timing,
                'duration_value' => $d->duration_value,
                'duration_unit' => $d->duration_unit,
                'custom_instruction' => $d->custom_instruction,
            ])
            ->values();

        return Inertia::render('Doctor/Settings/MedicineDefaults', [
            'frequent' => $frequent,
            'defaults' => $defaults,
            'frequent_cap' => MedicineController::FREQUENT_CAP,
        ]);
    }

    public function reorderFrequent(Request $request)
    {
        $data = $request->validate([
            'ordered_medicine_ids' => ['required', 'array'],
            'ordered_medicine_ids.*' => ['integer'],
        ]);

        $doctorId = $request->user()->id;

        foreach ($data['ordered_medicine_ids'] as $i => $mid) {
            DoctorFrequentMedicine::where('doctor_id', $doctorId)
                ->where('medicine_id', $mid)
                ->update(['sort_order' => $i]);
        }

        return response()->json(['ok' => true]);
    }
}
