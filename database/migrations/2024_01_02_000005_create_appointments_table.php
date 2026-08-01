<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('chamber_id')->nullable()->constrained('chambers')->nullOnDelete();
            $table->date('appointment_date');
            $table->unsignedInteger('serial_number');
            $table->enum('status', ['waiting', 'in_progress', 'completed', 'absent', 'cancelled'])->default('waiting');
            $table->enum('type', ['new_visit', 'follow_up', 'emergency'])->default('new_visit');
            $table->decimal('fee_amount', 10, 2)->default(0);
            $table->boolean('fee_paid')->default(false);
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hospital_id', 'doctor_id', 'appointment_date']);
            $table->index(['hospital_id', 'appointment_date']);
            $table->index(['doctor_id', 'appointment_date', 'serial_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
