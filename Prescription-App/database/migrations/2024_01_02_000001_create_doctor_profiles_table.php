<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->string('bmdc_number')->nullable();
            $table->string('degrees')->nullable();
            $table->string('specialization')->nullable();
            $table->string('designation')->nullable();
            $table->decimal('consultation_fee', 10, 2)->default(0);
            $table->decimal('follow_up_fee', 10, 2)->default(0);
            $table->string('prescription_header_image')->nullable();
            $table->string('prescription_footer_image')->nullable();
            $table->text('prescription_header_text')->nullable();
            $table->text('prescription_footer_text')->nullable();
            $table->string('signature_image')->nullable();
            $table->enum('default_prescription_language', ['bn', 'en', 'both'])->default('both');
            $table->timestamps();

            $table->index(['hospital_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
