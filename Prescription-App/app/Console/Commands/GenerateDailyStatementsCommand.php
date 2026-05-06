<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Hospital;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GenerateDailyStatementsCommand extends Command
{
    protected $signature = 'medixpro:generate-daily-statements {--date= : YYYY-MM-DD, defaults to yesterday}';

    protected $description = 'Generate per-hospital daily revenue + visit statement CSVs into storage/statements/{date}/.';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))->toDateString()
            : now()->subDay()->toDateString();

        $hospitals = Hospital::query()->where('is_active', true)->get(['id', 'name', 'slug']);
        $written = 0;

        foreach ($hospitals as $hospital) {
            $rows = Appointment::query()
                ->leftJoin('users', 'users.id', '=', 'appointments.doctor_id')
                ->where('appointments.hospital_id', $hospital->id)
                ->whereDate('appointments.appointment_date', $date)
                ->groupBy('users.id', 'users.name')
                ->selectRaw(
                    'users.id as doctor_id, users.name as doctor_name, '
                    . 'COUNT(*) as visits, '
                    . 'SUM(CASE WHEN appointments.status = "completed" THEN 1 ELSE 0 END) as completed, '
                    . 'SUM(CASE WHEN appointments.fee_paid = 1 THEN appointments.fee_amount ELSE 0 END) as revenue'
                )
                ->get();

            if ($rows->isEmpty()) {
                continue;
            }

            $csv = "Doctor,Visits,Completed,Revenue\n";
            $totalRevenue = 0;
            foreach ($rows as $r) {
                $csv .= sprintf("%s,%d,%d,%.2f\n",
                    str_replace(',', ' ', (string) $r->doctor_name),
                    (int) $r->visits,
                    (int) $r->completed,
                    (float) $r->revenue,
                );
                $totalRevenue += (float) $r->revenue;
            }
            $csv .= sprintf("TOTAL,,,%.2f\n", $totalRevenue);

            $path = "statements/{$date}/{$hospital->slug}.csv";
            Storage::disk('local')->put($path, $csv);
            $written++;
        }

        $this->info("Wrote {$written} statement(s) for {$date}.");
        return self::SUCCESS;
    }
}
