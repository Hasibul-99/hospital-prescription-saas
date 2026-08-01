<?php

namespace Database\Seeders;

use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/medicines.json');

        if (! file_exists($path)) {
            $this->command->error("Medicine data file not found: {$path}");
            return;
        }

        $medicines = json_decode(file_get_contents($path), true);

        foreach ($medicines as $med) {
            Medicine::updateOrCreate(
                [
                    'brand_name' => $med['brand_name'],
                    'strength' => $med['strength'],
                    'manufacturer' => $med['manufacturer'],
                ],
                [
                    'generic_name' => $med['generic_name'],
                    'type' => $med['type'],
                    'price' => $med['price'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Seeded ' . count($medicines) . ' medicines.');
    }
}
