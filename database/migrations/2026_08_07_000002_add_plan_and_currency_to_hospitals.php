<?php

use Database\Seeders\PlanSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Moves hospitals off the hardcoded `subscription_plan` enum onto a real
 * `plans` FK, and gives each hospital its own display currency.
 *
 * `max_doctors` / `max_patients_per_month` become nullable *overrides* — NULL
 * means "inherit from the plan", which is now the normal case. A non-null value
 * is a deliberate per-hospital exception granted by the super admin.
 *
 * Additive + backfilled in place: existing rows keep their limits, so no
 * migrate:fresh is required.
 */
return new class extends Migration
{
    private const PLAN_CODES = ['free', 'basic', 'premium', 'enterprise'];

    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->unsignedBigInteger('plan_id')->nullable()->after('slug');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly')->after('plan_id');
            $table->char('currency', 3)->default('BDT')->after('billing_cycle');
        });

        // Plan rows must exist before we can point hospitals at them. The seeder
        // is updateOrCreate-idempotent, so a later `db:seed` is still safe.
        (new PlanSeeder)->run();

        $planIdsByCode = DB::table('plans')->pluck('id', 'code');

        foreach (self::PLAN_CODES as $code) {
            if (isset($planIdsByCode[$code])) {
                DB::table('hospitals')
                    ->where('subscription_plan', $code)
                    ->update(['plan_id' => $planIdsByCode[$code]]);
            }
        }

        Schema::table('hospitals', function (Blueprint $table) {
            $table->foreign('plan_id')->references('id')->on('plans')->nullOnDelete();
        });

        Schema::table('hospitals', function (Blueprint $table) {
            $table->renameColumn('max_doctors', 'max_doctors_override');
            $table->renameColumn('max_patients_per_month', 'max_patients_per_month_override');
        });

        Schema::table('hospitals', function (Blueprint $table) {
            $table->unsignedInteger('max_doctors_override')->nullable()->default(null)->change();
            $table->unsignedInteger('max_patients_per_month_override')->nullable()->default(null)->change();
        });

        // An override that merely restates the plan's own limit is noise — clear it
        // so the hospital tracks the plan when the plan is later re-priced.
        $plans = DB::table('plans')->get(['id', 'max_doctors', 'max_patients_per_month']);

        foreach ($plans as $plan) {
            DB::table('hospitals')
                ->where('plan_id', $plan->id)
                ->where('max_doctors_override', $plan->max_doctors)
                ->update(['max_doctors_override' => null]);

            DB::table('hospitals')
                ->where('plan_id', $plan->id)
                ->where('max_patients_per_month_override', $plan->max_patients_per_month)
                ->update(['max_patients_per_month_override' => null]);
        }

        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn('subscription_plan');
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->enum('subscription_plan', self::PLAN_CODES)->default('free')->after('slug');
        });

        $codesById = DB::table('plans')->pluck('code', 'id');

        foreach ($codesById as $id => $code) {
            if (in_array($code, self::PLAN_CODES, true)) {
                DB::table('hospitals')->where('plan_id', $id)->update(['subscription_plan' => $code]);
            }
        }

        Schema::table('hospitals', function (Blueprint $table) {
            $table->renameColumn('max_doctors_override', 'max_doctors');
            $table->renameColumn('max_patients_per_month_override', 'max_patients_per_month');
        });

        DB::table('hospitals')->whereNull('max_doctors')->update(['max_doctors' => 5]);
        DB::table('hospitals')->whereNull('max_patients_per_month')->update(['max_patients_per_month' => 100]);

        Schema::table('hospitals', function (Blueprint $table) {
            $table->unsignedInteger('max_doctors')->default(5)->change();
            $table->unsignedInteger('max_patients_per_month')->default(100)->change();
        });

        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'billing_cycle', 'currency']);
        });
    }
};
