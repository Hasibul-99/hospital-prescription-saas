<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('disease_name');
            $table->json('complaints')->nullable();
            $table->json('examinations')->nullable();
            $table->json('medicines')->nullable();
            $table->json('advices')->nullable();
            $table->json('investigations')->nullable();
            $table->boolean('is_global')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedInteger('use_count')->default(0);
            $table->timestamps();

            $table->index(['doctor_id', 'hospital_id']);
        });

        Schema::create('doctor_medicine_defaults', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
            $table->decimal('dose_morning', 5, 2)->nullable();
            $table->decimal('dose_noon', 5, 2)->nullable();
            $table->decimal('dose_afternoon', 5, 2)->nullable();
            $table->decimal('dose_night', 5, 2)->nullable();
            $table->decimal('dose_bedtime', 5, 2)->nullable();
            $table->enum('timing', ['before_meal', 'after_meal', 'empty_stomach', 'with_food', 'custom'])->nullable();
            $table->unsignedInteger('duration_value')->nullable();
            $table->enum('duration_unit', ['days', 'weeks', 'months', 'years', 'continue', 'N_A'])->nullable();
            $table->text('custom_instruction')->nullable();
            $table->timestamps();

            $table->unique(['doctor_id', 'medicine_id']);
        });

        Schema::create('doctor_frequent_medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('medicines')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['doctor_id', 'medicine_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_frequent_medicines');
        Schema::dropIfExists('doctor_medicine_defaults');
        Schema::dropIfExists('doctor_templates');
    }
};
