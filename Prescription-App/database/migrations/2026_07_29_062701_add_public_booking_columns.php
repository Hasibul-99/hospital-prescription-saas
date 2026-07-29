<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->boolean('is_public_profile')->default(false)->after('default_prescription_language');
            $table->string('public_slug')->nullable()->unique()->after('is_public_profile');
        });

        Schema::table('chambers', function (Blueprint $table) {
            $table->unsignedSmallInteger('daily_slot_cap')->nullable()->after('schedule');
        });

        // Extend otp_verifications.purpose to accept 'booking'.
        // MySQL enum changes require raw SQL; SQLite ignores enum constraints entirely
        // so a no-op is safe there.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE otp_verifications MODIFY COLUMN purpose ENUM('registration','password_reset','booking') NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropColumn(['is_public_profile', 'public_slug']);
        });

        Schema::table('chambers', function (Blueprint $table) {
            $table->dropColumn('daily_slot_cap');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE otp_verifications MODIFY COLUMN purpose ENUM('registration','password_reset') NOT NULL");
        }
    }
};
