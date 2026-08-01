<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chambers', function (Blueprint $table) {
            // full  = doctor keeps 100% of collected fees
            // split = doctor keeps `share_percent_doctor`%, hospital keeps rest
            // rent  = doctor keeps 100% but owes hospital `rent_amount_monthly` divided by days-in-month
            $table->enum('share_model', ['full', 'split', 'rent'])->default('full')->after('daily_slot_cap');
            $table->decimal('share_percent_doctor', 5, 2)->nullable()->after('share_model');
            $table->decimal('rent_amount_monthly', 10, 2)->nullable()->after('share_percent_doctor');
            $table->string('share_notes', 255)->nullable()->after('rent_amount_monthly');
        });
    }

    public function down(): void
    {
        Schema::table('chambers', function (Blueprint $table) {
            $table->dropColumn(['share_model', 'share_percent_doctor', 'rent_amount_monthly', 'share_notes']);
        });
    }
};
