<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->unsignedInteger('contact_attempts')->default(0)->after('follow_up_duration_unit');
            $table->timestamp('last_contact_at')->nullable()->after('contact_attempts');
            $table->enum('recall_status', ['pending', 'contacted', 'unreachable', 'completed'])
                ->default('pending')
                ->after('last_contact_at');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['contact_attempts', 'last_contact_at', 'recall_status']);
        });
    }
};
