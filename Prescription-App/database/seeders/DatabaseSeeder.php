<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Platform-level (no hospital dependency)
            SuperAdminSeeder::class,
            MedicineSeeder::class,
            ComplaintMasterSeeder::class,

            // Demo tenant data
            DemoHospitalSeeder::class,
            DemoUsersSeeder::class,
            DemoPatientsSeeder::class,
            DemoAppointmentsAndPrescriptionsSeeder::class,
        ]);
    }
}
