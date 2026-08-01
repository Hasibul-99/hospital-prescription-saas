<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_vitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('recorded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at');

            // All nullable — record only what was measured.
            $table->unsignedSmallInteger('systolic')->nullable();     // mmHg
            $table->unsignedSmallInteger('diastolic')->nullable();    // mmHg
            $table->unsignedSmallInteger('pulse')->nullable();        // bpm
            $table->decimal('temperature', 4, 1)->nullable();         // °F (e.g. 100.4)
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->unsignedTinyInteger('spo2')->nullable();          // %
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['hospital_id', 'patient_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_vitals');
    }
};
