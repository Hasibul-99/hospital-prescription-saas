<?php

namespace Database\Seeders;

use App\Models\Hospital;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class DemoPatientsSeeder extends Seeder
{
    public function run(): void
    {
        $hospital = Hospital::where('slug', 'city-medical-center')->firstOrFail();

        $patients = [
            [
                'name'        => 'Mohammad Karim',
                'age_years'   => 45,
                'gender'      => 'male',
                'phone'       => '01800000001',
                'blood_group' => 'B+',
                'address'     => 'House 5, Road 3, Dhanmondi, Dhaka',
                'notes'       => 'Diabetic (Type 2). On Metformin.',
            ],
            [
                'name'        => 'Shamima Begum',
                'age_years'   => 38,
                'gender'      => 'female',
                'phone'       => '01800000002',
                'blood_group' => 'A+',
                'address'     => 'Flat 4B, Mirpur-10, Dhaka',
                'notes'       => 'Hypertension. Penicillin allergy.',
            ],
            [
                'name'        => 'Rafiqul Hasan',
                'age_years'   => 60,
                'gender'      => 'male',
                'phone'       => '01800000003',
                'blood_group' => 'O+',
                'address'     => 'Mohakhali, Dhaka',
                'notes'       => 'History of heart disease. No known drug allergy.',
            ],
            [
                'name'        => 'Nasrin Akter',
                'age_years'   => 29,
                'gender'      => 'female',
                'phone'       => '01800000004',
                'blood_group' => 'AB+',
                'address'     => 'Bashundhara R/A, Dhaka',
                'notes'       => null,
            ],
            [
                'name'        => 'Habibur Rahman',
                'age_years'   => 52,
                'gender'      => 'male',
                'phone'       => '01800000005',
                'blood_group' => 'A-',
                'address'     => 'Uttara Sector 7, Dhaka',
                'notes'       => 'Asthma. Aspirin sensitivity.',
            ],
            [
                'name'        => 'Taslima Khatun',
                'age_years'   => 35,
                'gender'      => 'female',
                'phone'       => '01800000006',
                'blood_group' => 'B-',
                'address'     => 'Gulshan 2, Dhaka',
                'notes'       => null,
            ],
            [
                'name'        => 'Aminul Islam',
                'age_years'   => 8,
                'age_months'  => 6,
                'gender'      => 'male',
                'phone'       => '01800000007',
                'blood_group' => 'O-',
                'address'     => 'Khilgaon, Dhaka',
                'notes'       => 'Paediatric patient. Guardian: Mrs. Islam (mother).',
            ],
            [
                'name'        => 'Ruksana Parvin',
                'age_years'   => 67,
                'gender'      => 'female',
                'phone'       => '01800000008',
                'blood_group' => 'B+',
                'address'     => 'Old Dhaka, Lalbagh',
                'notes'       => 'Rheumatoid arthritis. On long-term NSAIDs.',
            ],
            [
                'name'        => 'Shafiqul Alam',
                'age_years'   => 42,
                'gender'      => 'male',
                'phone'       => '01800000009',
                'blood_group' => 'A+',
                'address'     => 'Mohammadpur, Dhaka',
                'notes'       => null,
            ],
            [
                'name'        => 'Dilruba Yesmin',
                'age_years'   => 24,
                'gender'      => 'female',
                'phone'       => '01800000010',
                'blood_group' => 'AB-',
                'address'     => 'Rayer Bazar, Dhaka',
                'notes'       => 'Pregnant (2nd trimester). Folic acid prescribed.',
            ],
        ];

        foreach ($patients as $data) {
            Patient::updateOrCreate(
                ['hospital_id' => $hospital->id, 'phone' => $data['phone']],
                array_merge(['hospital_id' => $hospital->id, 'is_active' => true, 'age_months' => 0, 'age_days' => 0], $data)
            );
        }

        $this->command->info('10 demo patients seeded.');
    }
}
