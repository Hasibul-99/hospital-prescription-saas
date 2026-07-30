<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('icd10_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->string('title', 512);
            $table->string('chapter', 128)->nullable();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('CREATE FULLTEXT INDEX icd10_codes_title_ft ON icd10_codes (title)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('icd10_codes');
    }
};
