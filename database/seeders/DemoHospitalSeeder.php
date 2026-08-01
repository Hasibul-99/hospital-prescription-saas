<?php

namespace Database\Seeders;

use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoHospitalSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->firstOrFail();

        Hospital::updateOrCreate(
            ['slug' => 'city-medical-center'],
            [
                'name'                    => 'City Medical Center',
                'address'                 => '12 Hospital Road, Dhaka 1205, Bangladesh',
                'phone'                   => '+880 1900 000001',
                'email'                   => 'info@citymedical.bd',
                'website'                 => 'https://citymedical.bd',
                'subscription_plan'       => 'premium',
                'subscription_status'     => 'active',
                'subscription_starts_at'  => now()->startOfMonth(),
                'subscription_ends_at'    => now()->addYear(),
                'max_doctors'             => 20,
                'max_patients_per_month'  => 2000,
                'is_active'               => true,
                'created_by'              => $admin->id,
            ]
        );
    }
}
