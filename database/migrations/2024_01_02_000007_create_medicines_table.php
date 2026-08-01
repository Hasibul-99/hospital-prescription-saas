<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('brand_name');
            $table->string('generic_name')->nullable();
            $table->enum('type', [
                'Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream',
                'Drops', 'Mouthwash', 'Toothpaste', 'Gel', 'Powder', 'Suspension',
                'Ointment', 'Inhaler'
            ]);
            $table->string('strength')->nullable();
            $table->string('manufacturer')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_pending_approval')->default(false);
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['brand_name', 'generic_name']);
            }
        });

        Schema::create('complaint_masters', function (Blueprint $table) {
            $table->id();
            $table->string('name_en');
            $table->string('name_bn')->nullable();
            $table->string('category')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('complaint_duration_presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complaint_master_id')->constrained('complaint_masters')->cascadeOnDelete();
            $table->string('duration_text_en');
            $table->string('duration_text_bn')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaint_duration_presets');
        Schema::dropIfExists('complaint_masters');
        Schema::dropIfExists('medicines');
    }
};
