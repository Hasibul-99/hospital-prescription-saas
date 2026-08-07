<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();

            // Stable machine key. Replaces the old hospitals.subscription_plan enum
            // and the config/subscription.php array keys. Immutable after create.
            $table->string('code')->unique();

            $table->string('name');
            $table->string('name_bn')->nullable();
            $table->string('tagline')->nullable();
            $table->string('tagline_bn')->nullable();

            // Prices are in the platform base currency (PlatformSetting 'platform.currency').
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->nullable();

            // NULL on any limit means unlimited.
            $table->unsignedInteger('max_doctors')->nullable();
            $table->unsignedInteger('max_patients_per_month')->nullable();
            $table->unsignedInteger('max_prescriptions')->nullable();

            $table->unsignedSmallInteger('trial_days')->default(0);

            // [{ "en": "Up to 5 doctors", "bn": "৫ জন ডাক্তার পর্যন্ত" }, ...]
            $table->json('features')->nullable();

            $table->string('cta_label')->nullable();
            $table->string('cta_label_bn')->nullable();

            $table->boolean('is_public')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->softDeletes();
            $table->timestamps();

            $table->index(['is_public', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
