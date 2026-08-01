<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->unsignedInteger('prescription_quota_used')->default(0)->after('trial_ends_at');
            $table->timestamp('prescription_quota_reset_at')->nullable()->after('prescription_quota_used');
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn(['prescription_quota_used', 'prescription_quota_reset_at']);
        });
    }
};
