<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'phone' => '01700000000',
                'role' => 'super_admin',
                'hospital_id' => null,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
