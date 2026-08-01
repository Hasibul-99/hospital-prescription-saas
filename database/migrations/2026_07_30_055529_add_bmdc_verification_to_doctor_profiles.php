<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->boolean('bmdc_verified')->default(false)->after('bmdc_number');
            $table->timestamp('bmdc_verified_at')->nullable()->after('bmdc_verified');
            $table->foreignId('bmdc_verified_by')->nullable()->after('bmdc_verified_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bmdc_verified_by');
            $table->dropColumn(['bmdc_verified', 'bmdc_verified_at']);
        });
    }
};
