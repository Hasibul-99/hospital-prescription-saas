<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrescriptionRequest;
use App\Models\Appointment;
use App\Models\ComplaintMaster;
use App\Models\DoctorFrequentMedicine;
use App\Models\DoctorTemplate;
use App\Models\Patient;
use App\Models\Prescription;
use App\Services\PrescriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrescriptionController extends Controller
{
    public function __construct(private readonly PrescriptionService $service)
    {
    }

    public function create(Request $request)
    {
        $this->authorize('create', Prescription::class);

        $user = $request->user();
        $patient = Patient::findOrFail($request->input('patient_id'));
        $appointmentId = $request->input('appointment_id');
        $appointment = $appointmentId ? Appointment::find($appointmentId) : null;

        $draft = Prescription::query()
            ->where('patient_id', $patient->id)
            ->where('doctor_id', $user->id)
            ->where('status', 'draft')
            ->when($appointment, fn ($q) => $q->where('appointment_id', $appointment->id))
            ->with(['complaints', 'examinations', 'sections', 'medicines'])
            ->orderByDesc('id')
            ->first();

        return Inertia::render('Doctor/Prescriptions/Create', [
            'patient' => $patient,
            'appointment' => $appointment,
            'draft' => $draft,
            'complaint_masters' => ComplaintMaster::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name_en', 'name_bn', 'category']),
            'duration_presets' => $this->durationPresets(),
            'templates' => $this->templatesFor($user),
            'previous_prescriptions' => $this->previousRxFor($patient->id, $user->hospital_id),
            'advice_suggestions' => $this->adviceSuggestions(),
            'diagnosis_suggestions' => $this->diagnosisSuggestions(),
            'frequent_medicines' => $this->frequentMedicinesFor($user),
            'instruction_presets' => $this->instructionPresets(),
            'duration_day_presets' => [1, 5, 7, 14, 30],
        ]);
    }

    public function store(StorePrescriptionRequest $request)
    {
        $rx = $this->service->save($request->user(), $request->validated());

        if ($request->wantsJson() || $request->input('_json')) {
            return response()->json([
                'id' => $rx->id,
                'prescription_uid' => $rx->prescription_uid,
                'status' => $rx->status,
            ]);
        }

        if ($request->input('_action') === 'print') {
            return redirect("/doctor/prescriptions/{$rx->id}/preview");
        }

        return redirect("/doctor/prescriptions/{$rx->id}/edit")->with('success', 'Prescription saved.');
    }

    public function edit(Prescription $prescription)
    {
        $this->authorize('update', $prescription);

        $prescription->load(['complaints', 'examinations', 'sections', 'medicines', 'patient', 'appointment']);

        $user = request()->user();

        return Inertia::render('Doctor/Prescriptions/Create', [
            'patient' => $prescription->patient,
            'appointment' => $prescription->appointment,
            'draft' => $prescription,
            'complaint_masters' => ComplaintMaster::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name_en', 'name_bn', 'category']),
            'duration_presets' => $this->durationPresets(),
            'templates' => $this->templatesFor($user),
            'previous_prescriptions' => $this->previousRxFor($prescription->patient_id, $prescription->hospital_id, $prescription->id),
            'advice_suggestions' => $this->adviceSuggestions(),
            'diagnosis_suggestions' => $this->diagnosisSuggestions(),
            'frequent_medicines' => $this->frequentMedicinesFor($user),
            'instruction_presets' => $this->instructionPresets(),
            'duration_day_presets' => [1, 5, 7, 14, 30],
        ]);
    }

    public function update(StorePrescriptionRequest $request, Prescription $prescription)
    {
        $this->authorize('update', $prescription);

        $this->service->save($request->user(), $request->validated(), $prescription);

        if ($request->wantsJson() || $request->input('_json')) {
            return response()->json(['id' => $prescription->id, 'status' => $prescription->fresh()->status]);
        }

        if ($request->input('_action') === 'print') {
            return redirect("/doctor/prescriptions/{$prescription->id}/preview");
        }

        return redirect("/doctor/prescriptions/{$prescription->id}/edit")->with('success', 'Prescription saved.');
    }

    protected function templatesFor($user)
    {
        return DoctorTemplate::query()
            ->where(function ($q) use ($user) {
                $q->where(function ($qq) use ($user) {
                    $qq->where('doctor_id', $user->id)->where('hospital_id', $user->hospital_id);
                })->orWhere('is_global', true);
            })
            ->orderByDesc('last_used_at')
            ->orderBy('disease_name')
            ->get(['id', 'doctor_id', 'disease_name', 'is_global', 'last_used_at', 'use_count', 'updated_at']);
    }

    protected function previousRxFor(int $patientId, int $hospitalId, ?int $excludeId = null)
    {
        return Prescription::query()
            ->where('patient_id', $patientId)
            ->where('hospital_id', $hospitalId)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->with(['doctor:id,name', 'sections', 'complaints', 'medicines'])
            ->orderByDesc('date')
            ->limit(20)
            ->get();
    }

    protected function durationPresets(): array
    {
        return [
            '1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days', '10 days', '15 days', '20 days',
            '1 month', '2 months', '3 months', '6 months', '1 year',
            'Few days', 'Frequent', 'Continuous', 'At night', 'High grade continued',
        ];
    }

    protected function adviceSuggestions(): array
    {
        return [
            ['en' => 'Get tests done', 'bn' => 'পরীক্ষা করে দেখান'],
            ['en' => 'Drink plenty of water', 'bn' => 'প্রচুর পানি খাবেন'],
            ['en' => 'Take rest', 'bn' => 'বিশ্রাম নিবেন'],
            ['en' => 'Avoid cold food', 'bn' => 'ঠাণ্ডা খাবার এড়িয়ে চলুন'],
            ['en' => 'Avoid oily food', 'bn' => 'তৈলাক্ত খাবার এড়িয়ে চলুন'],
            ['en' => 'Walk daily', 'bn' => 'প্রতিদিন হাঁটবেন'],
            ['en' => 'Take medicine regularly', 'bn' => 'নিয়মিত ঔষধ সেবন করবেন'],
            ['en' => 'Come back if symptoms persist', 'bn' => 'সমস্যা থাকলে পুনরায় আসবেন'],
        ];
    }

    protected function frequentMedicinesFor($user): array
    {
        return DoctorFrequentMedicine::query()
            ->where('doctor_id', $user->id)
            ->orderBy('sort_order')
            ->with('medicine:id,brand_name,generic_name,type,strength,manufacturer')
            ->get()
            ->map(fn ($f) => $f->medicine)
            ->filter()
            ->values()
            ->toArray();
    }

    protected function instructionPresets(): array
    {
        return [
            'খাবারের পরে',
            'খাবারের আগে',
            'খাবারের সাথে',
            '0/6+0/6+0/6 খাবারের পরে',
            '1/0+1/0+1+1/0 খাবারের পরে',
            'If Fever or Pain',
            '2/3 অথবা তিন ও চার ঘণ্টা পরপর খাবারের পরে',
            'খুব 100°F এ বা তার চেয়ে বেশি হলে',
            'যন্ত্রণা থাকলে',
        ];
    }

    protected function diagnosisSuggestions(): array
    {
        return [
            'Viral fever',
            'Upper respiratory tract infection (URTI)',
            'Acute bronchitis',
            'Acute gastroenteritis',
            'Gastritis',
            'Peptic ulcer disease',
            'Urinary tract infection (UTI)',
            'Hypertension',
            'Type 2 Diabetes Mellitus',
            'Migraine',
            'Iron deficiency anemia',
            'Asthma',
            'Allergic rhinitis',
            'Dyspepsia',
            'Typhoid fever',
            'Dengue fever',
        ];
    }
}
