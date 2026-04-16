<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('prescription_uid')->unique();
            $table->date('date');
            $table->date('follow_up_date')->nullable();
            $table->unsignedInteger('follow_up_duration_value')->nullable();
            $table->enum('follow_up_duration_unit', ['days', 'months', 'years'])->nullable();
            $table->foreignId('template_id')->nullable();
            $table->enum('status', ['draft', 'finalized', 'printed'])->default('draft');
            $table->timestamp('printed_at')->nullable();
            $table->unsignedInteger('printed_count')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hospital_id', 'doctor_id']);
            $table->index(['hospital_id', 'patient_id']);
            $table->index(['patient_id', 'created_at']);
        });

        Schema::create('prescription_complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->string('complaint_name');
            $table->string('duration_text')->nullable();
            $table->text('note')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('prescription_examinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->string('examination_name');
            $table->string('finding_value')->nullable();
            $table->text('note')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('prescription_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->enum('section_type', [
                'past_history', 'drug_history', 'investigation', 'diagnosis',
                'advice', 'next_plan', 'hospitalization', 'operation_note'
            ]);
            $table->text('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('prescription_medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('medicine_id')->nullable();
            $table->string('medicine_name');
            $table->string('medicine_type')->nullable();
            $table->string('strength')->nullable();
            $table->string('generic_name')->nullable();
            $table->decimal('dose_morning', 5, 2)->nullable();
            $table->decimal('dose_noon', 5, 2)->nullable();
            $table->decimal('dose_afternoon', 5, 2)->nullable();
            $table->decimal('dose_night', 5, 2)->nullable();
            $table->decimal('dose_bedtime', 5, 2)->nullable();
            $table->string('dose_display')->nullable();
            $table->enum('timing', ['before_meal', 'after_meal', 'empty_stomach', 'with_food', 'custom'])->nullable();
            $table->unsignedInteger('duration_value')->nullable();
            $table->enum('duration_unit', ['days', 'weeks', 'months', 'years', 'continue', 'N_A'])->nullable();
            $table->text('custom_instruction')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_medicines');
        Schema::dropIfExists('prescription_sections');
        Schema::dropIfExists('prescription_examinations');
        Schema::dropIfExists('prescription_complaints');
        Schema::dropIfExists('prescriptions');
    }
};
