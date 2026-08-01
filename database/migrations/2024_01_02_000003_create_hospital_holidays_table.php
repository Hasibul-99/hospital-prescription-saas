<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hospital_id')->constrained('hospitals')->cascadeOnDelete();
            $table->date('date');
            $table->string('title');
            $table->boolean('is_recurring_yearly')->default(false);
            $table->timestamps();

            $table->index(['hospital_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_holidays');
    }
};
