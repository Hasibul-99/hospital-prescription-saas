<?php

use App\Models\Prescription;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->string('share_token', 32)->nullable()->unique()->after('prescription_uid');
        });

        // Backfill so already-issued prescriptions can be verified via the
        // public /rx/verify link too.
        Prescription::withoutGlobalScopes()
            ->whereNull('share_token')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                foreach ($rows as $rx) {
                    $rx->forceFill(['share_token' => Str::random(32)])->saveQuietly();
                }
            });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropUnique(['share_token']);
            $table->dropColumn('share_token');
        });
    }
};
