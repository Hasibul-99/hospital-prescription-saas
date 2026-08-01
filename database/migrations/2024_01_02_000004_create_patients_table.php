<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('patient_uid')->unique();
            $table->string('name');
            $table->unsignedTinyInteger('age_years')->nullable();
            $table->unsignedTinyInteger('age_months')->nullable();
            $table->unsignedTinyInteger('age_days')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('profile_image')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['hospital_id', 'phone']);
            $table->index(['hospital_id', 'name']);
            $table->index(['hospital_id', 'patient_uid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
