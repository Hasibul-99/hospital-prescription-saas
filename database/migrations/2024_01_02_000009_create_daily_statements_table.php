<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('total_patients')->default(0);
            $table->unsignedInteger('total_new_patients')->default(0);
            $table->unsignedInteger('total_follow_ups')->default(0);
            $table->decimal('total_earned', 12, 2)->default(0);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->decimal('total_unpaid', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['hospital_id', 'doctor_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_statements');
    }
};
