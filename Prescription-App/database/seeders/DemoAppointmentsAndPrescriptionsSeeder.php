<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\Hospital;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionComplaint;
use App\Models\PrescriptionMedicine;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoAppointmentsAndPrescriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $hospital   = Hospital::where('slug', 'city-medical-center')->firstOrFail();
        $doctor1    = User::where('email', 'dr.rahman@citymedical.bd')->firstOrFail();
        $doctor2    = User::where('email', 'dr.sultana@citymedical.bd')->firstOrFail();
        $chamber1   = Chamber::where('doctor_id', $doctor1->id)->first();
        $chamber2   = Chamber::where('doctor_id', $doctor2->id)->first();
        $receptionist = User::where('email', 'receptionist@citymedical.bd')->firstOrFail();
        $patients   = Patient::where('hospital_id', $hospital->id)->get();
        $medicines  = Medicine::limit(20)->get();

        $today = now()->toDateString();

        // ── Past appointments (last 7 days) — completed ───────────────
        $pastDays = collect(range(1, 7))->map(fn($d) => now()->subDays($d)->toDateString());

        $completedPairs = [
            [$doctor1, $chamber1],
            [$doctor2, $chamber2],
        ];

        foreach ($pastDays as $dayIndex => $date) {
            [$doctor, $chamber] = $completedPairs[$dayIndex % 2];
            $dayPatients = $patients->shuffle()->take(3);
            $serial = 1;

            foreach ($dayPatients as $patient) {
                $appointment = Appointment::firstOrCreate(
                    [
                        'hospital_id'      => $hospital->id,
                        'doctor_id'        => $doctor->id,
                        'patient_id'       => $patient->id,
                        'appointment_date' => $date,
                        'serial_number'    => $serial,
                    ],
                    [
                        'chamber_id'    => $chamber?->id,
                        'status'        => 'completed',
                        'type'          => 'new_visit',
                        'fee_amount'    => $doctor->id === $doctor1->id ? 800 : 1200,
                        'fee_paid'      => true,
                        'payment_method'=> 'cash',
                        'created_by'    => $receptionist->id,
                    ]
                );

                // Create a prescription for each completed appointment
                $this->createPrescription($hospital, $doctor, $patient, $appointment, $medicines, $date, 'finalized');

                $serial++;
            }
        }

        // ── Today's appointments (scheduled) ─────────────────────────
        $todayPatients = $patients->take(6);
        $serial = 1;
        foreach ($todayPatients->take(4) as $patient) {
            Appointment::firstOrCreate(
                [
                    'hospital_id'      => $hospital->id,
                    'doctor_id'        => $doctor1->id,
                    'patient_id'       => $patient->id,
                    'appointment_date' => $today,
                    'serial_number'    => $serial,
                ],
                [
                    'chamber_id'     => $chamber1?->id,
                    'status'         => $serial <= 1 ? 'completed' : ($serial === 2 ? 'in_progress' : 'waiting'),
                    'type'           => 'new_visit',
                    'fee_amount'     => 800,
                    'fee_paid'       => $serial <= 2,
                    'payment_method' => 'cash',
                    'created_by'     => $receptionist->id,
                ]
            );
            $serial++;
        }

        $serial = 1;
        foreach ($todayPatients->skip(4)->take(2) as $patient) {
            Appointment::firstOrCreate(
                [
                    'hospital_id'      => $hospital->id,
                    'doctor_id'        => $doctor2->id,
                    'patient_id'       => $patient->id,
                    'appointment_date' => $today,
                    'serial_number'    => $serial,
                ],
                [
                    'chamber_id'  => $chamber2?->id,
                    'status'      => 'waiting',
                    'type'        => 'new_visit',
                    'fee_amount'  => 1200,
                    'fee_paid'    => false,
                    'created_by'  => $receptionist->id,
                ]
            );
            $serial++;
        }

        // ── One draft prescription ────────────────────────────────────
        if ($patients->isNotEmpty() && $medicines->isNotEmpty()) {
            $this->createPrescription($hospital, $doctor1, $patients->first(), null, $medicines, $today, 'draft');

        }

        $this->command->info('Appointments and prescriptions seeded.');
    }

    private function createPrescription(
        $hospital, $doctor, $patient, $appointment, $medicines, string $date, string $status
    ): void {
        if (Prescription::where('doctor_id', $doctor->id)
            ->where('patient_id', $patient->id)
            ->whereDate('date', $date)
            ->where('status', $status)
            ->exists()) {
            return;
        }

        $rx = Prescription::create([
            'hospital_id'    => $hospital->id,
            'doctor_id'      => $doctor->id,
            'patient_id'     => $patient->id,
            'appointment_id' => $appointment?->id,
            'date'           => $date,
            'status'         => $status,
            'follow_up_date' => $status === 'finalized' ? now()->parse($date)->addWeeks(2)->toDateString() : null,
        ]);

        // Add 2-3 random medicines
        $rxMeds = $medicines->shuffle()->take(rand(2, 3));
        $sort = 1;
        foreach ($rxMeds as $med) {
            PrescriptionMedicine::create([
                'prescription_id' => $rx->id,
                'medicine_id'     => $med->id,
                'medicine_name'   => $med->brand_name ?? $med->name ?? 'Unknown',
                'medicine_type'   => $med->type ?? 'tablet',
                'strength'        => $med->strength ?? null,
                'generic_name'    => $med->generic_name ?? null,
                'dose_morning'    => 1,
                'dose_noon'       => 0,
                'dose_night'      => 1,
                'dose_display'    => '1+0+1',
                'timing'          => 'after_meal',
                'duration_value'  => 7,
                'duration_unit'   => 'days',
                'sort_order'      => $sort++,
            ]);
        }

        // Add a complaint
        PrescriptionComplaint::create([
            'prescription_id' => $rx->id,
            'complaint_name'  => collect(['Fever', 'Headache', 'Cough', 'Chest pain', 'Shortness of breath', 'Body ache'])->random(),
            'duration_text'   => collect(['2 days', '3 days', '1 week', '10 days'])->random(),
            'sort_order'      => 1,
        ]);
    }
}
