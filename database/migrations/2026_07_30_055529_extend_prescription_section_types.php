<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const NEW_VALUES = [
        'past_history', 'drug_history', 'investigation', 'diagnosis',
        'advice', 'next_plan', 'hospitalization', 'operation_note',
        // Feature #7 additions
        'negative_history', 'gynae_history', 'obstetric_history',
        'breast_local', 'previous_reports', 'referred_by', 'notes',
        // Feature #36 addition
        'lab_referral',
    ];

    private const OLD_VALUES = [
        'past_history', 'drug_history', 'investigation', 'diagnosis',
        'advice', 'next_plan', 'hospitalization', 'operation_note',
    ];

    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $list = "'" . implode("','", self::NEW_VALUES) . "'";
            DB::statement("ALTER TABLE prescription_sections MODIFY COLUMN section_type ENUM({$list}) NOT NULL");
        }
        // SQLite ignores enum constraints; nothing to do.
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $list = "'" . implode("','", self::OLD_VALUES) . "'";
            DB::statement("ALTER TABLE prescription_sections MODIFY COLUMN section_type ENUM({$list}) NOT NULL");
        }
    }
};
