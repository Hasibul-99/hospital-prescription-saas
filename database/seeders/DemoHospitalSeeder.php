<?php

namespace Database\Seeders;

use App\Models\Hospital;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoHospitalSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $plan = Plan::where('code', 'premium')->firstOrFail();

        Hospital::updateOrCreate(
            ['slug' => 'city-medical-center'],
            [
                'name'                    => 'City Medical Center',
                'address'                 => '12 Hospital Road, Dhaka 1205, Bangladesh',
                'phone'                   => '+880 1900 000001',
                'email'                   => 'info@citymedical.bd',
                'website'                 => 'https://citymedical.bd',
                'plan_id'                 => $plan->id,
                'billing_cycle'           => 'monthly',
                'currency'                => 'BDT',
                'subscription_status'     => 'active',
                'subscription_starts_at'  => now()->startOfMonth(),
                'subscription_ends_at'    => now()->addYear(),
                // No overrides — limits come from the Premium plan.
                'max_doctors_override'            => null,
                'max_patients_per_month_override' => null,
                'is_active'               => true,
                'created_by'              => $admin->id,
            ]
        );
    }
}
