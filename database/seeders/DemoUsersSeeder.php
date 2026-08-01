<?php

namespace Database\Seeders;

use App\Models\Chamber;
use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $hospital = Hospital::where('slug', 'city-medical-center')->firstOrFail();

        // ── Hospital Admin ─────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'hospital.admin@citymedical.bd'],
            [
                'name'               => 'Hospital Administrator',
                'password'           => Hash::make('password'),
                'role'               => 'hospital_admin',
                'hospital_id'        => $hospital->id,
                'phone'              => '01900000002',
                'is_active'          => true,
                'email_verified_at'  => now(),
            ]
        );

        // ── Doctor 1 — General Medicine ────────────────────────────────
        $doctor1 = User::updateOrCreate(
            ['email' => 'dr.rahman@citymedical.bd'],
            [
                'name'               => 'Dr. Abdur Rahman',
                'password'           => Hash::make('password'),
                'role'               => 'doctor',
                'hospital_id'        => $hospital->id,
                'phone'              => '01711000001',
                'is_active'          => true,
                'email_verified_at'  => now(),
            ]
        );

        DoctorProfile::updateOrCreate(
            ['user_id' => $doctor1->id],
            [
                'hospital_id'                  => $hospital->id,
                'bmdc_number'                  => 'BMDC-A-12345',
                'degrees'                      => 'MBBS, FCPS (Medicine)',
                'specialization'               => 'Internal Medicine',
                'designation'                  => 'Senior Consultant',
                'consultation_fee'             => 800.00,
                'follow_up_fee'                => 400.00,
                'prescription_header_text'     => "Dr. Abdur Rahman\nMBBS, FCPS (Medicine)\nSenior Consultant, Internal Medicine\nReg: BMDC-A-12345",
                'prescription_footer_text'     => "City Medical Center | +880 1711 000001",
                'default_prescription_language' => 'en',
                'print_paper_size'             => 'A4',
                'notify_followup_reminders'    => true,
            ]
        );

        Chamber::updateOrCreate(
            ['doctor_id' => $doctor1->id, 'name' => 'Room 101'],
            [
                'hospital_id' => $hospital->id,
                'floor'       => '1st Floor',
                'building'    => 'Main Block',
                'is_active'   => true,
                'schedule'    => [
                    ['day' => 'Sunday',    'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'Monday',    'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'Tuesday',   'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'Wednesday', 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 'Thursday',  'start' => '09:00', 'end' => '13:00'],
                ],
            ]
        );

        // ── Doctor 2 — Cardiology ──────────────────────────────────────
        $doctor2 = User::updateOrCreate(
            ['email' => 'dr.sultana@citymedical.bd'],
            [
                'name'               => 'Dr. Fatema Sultana',
                'password'           => Hash::make('password'),
                'role'               => 'doctor',
                'hospital_id'        => $hospital->id,
                'phone'              => '01711000002',
                'is_active'          => true,
                'email_verified_at'  => now(),
            ]
        );

        DoctorProfile::updateOrCreate(
            ['user_id' => $doctor2->id],
            [
                'hospital_id'                  => $hospital->id,
                'bmdc_number'                  => 'BMDC-A-67890',
                'degrees'                      => 'MBBS, MD (Cardiology)',
                'specialization'               => 'Cardiology',
                'designation'                  => 'Associate Professor',
                'consultation_fee'             => 1200.00,
                'follow_up_fee'                => 600.00,
                'prescription_header_text'     => "Dr. Fatema Sultana\nMBBS, MD (Cardiology)\nAssociate Professor\nReg: BMDC-A-67890",
                'prescription_footer_text'     => "City Medical Center | +880 1711 000002",
                'default_prescription_language' => 'en',
                'print_paper_size'             => 'A4',
                'notify_followup_reminders'    => true,
            ]
        );

        Chamber::updateOrCreate(
            ['doctor_id' => $doctor2->id, 'name' => 'Room 205'],
            [
                'hospital_id' => $hospital->id,
                'floor'       => '2nd Floor',
                'building'    => 'Cardiology Wing',
                'is_active'   => true,
                'schedule'    => [
                    ['day' => 'Sunday',    'start' => '14:00', 'end' => '18:00'],
                    ['day' => 'Tuesday',   'start' => '14:00', 'end' => '18:00'],
                    ['day' => 'Thursday',  'start' => '14:00', 'end' => '18:00'],
                    ['day' => 'Saturday',  'start' => '10:00', 'end' => '14:00'],
                ],
            ]
        );

        // ── Receptionist ───────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'receptionist@citymedical.bd'],
            [
                'name'               => 'Nadia Islam',
                'password'           => Hash::make('password'),
                'role'               => 'receptionist',
                'hospital_id'        => $hospital->id,
                'phone'              => '01900000003',
                'is_active'          => true,
                'email_verified_at'  => now(),
            ]
        );

        $this->command->info('Users, profiles, and chambers seeded.');
    }
}
