<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\Hospital;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class GenerateDailyStatementsCommand extends Command
{
    protected $signature = 'medixpro:generate-daily-statements {--date= : YYYY-MM-DD, defaults to yesterday}';

    protected $description = 'Generate per-hospital daily revenue + settlement CSVs into storage/statements/{date}/.';

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : now()->subDay();
        $dateStr = $date->toDateString();

        $hospitals = Hospital::query()->where('is_active', true)->get(['id', 'name', 'slug']);
        $written = 0;

        foreach ($hospitals as $hospital) {
            // Per-chamber, per-doctor rollup — required to apply the correct
            // FULL / SPLIT / RENT settlement rule for each chamber.
            $rows = Appointment::query()
                ->leftJoin('users', 'users.id', '=', 'appointments.doctor_id')
                ->where('appointments.hospital_id', $hospital->id)
                ->whereDate('appointments.appointment_date', $dateStr)
                ->groupBy('users.id', 'users.name', 'appointments.chamber_id')
                ->selectRaw(
                    'users.id as doctor_id, users.name as doctor_name, appointments.chamber_id, '
                    . 'COUNT(*) as visits, '
                    . 'SUM(CASE WHEN appointments.status = "completed" THEN 1 ELSE 0 END) as completed, '
                    . 'SUM(CASE WHEN appointments.fee_paid = 1 THEN appointments.fee_amount ELSE 0 END) as revenue'
                )
                ->get();

            if ($rows->isEmpty()) {
                continue;
            }

            $chambers = Chamber::query()
                ->whereIn('id', $rows->pluck('chamber_id')->filter()->unique())
                ->get()
                ->keyBy('id');

            $csv = "Doctor,Chamber,Model,Visits,Completed,Revenue,Doctor Share,Hospital Share\n";
            $totalRevenue = 0;
            $totalDoctor  = 0;
            $totalHospital = 0;

            foreach ($rows as $r) {
                $chamber = $r->chamber_id ? $chambers->get($r->chamber_id) : null;
                $revenue = (float) $r->revenue;
                [$doctorShare, $hospitalShare] = $chamber
                    ? $chamber->splitRevenue($revenue, $date)
                    : [$revenue, 0.0];

                $csv .= sprintf("%s,%s,%s,%d,%d,%.2f,%.2f,%.2f\n",
                    str_replace(',', ' ', (string) $r->doctor_name),
                    str_replace(',', ' ', (string) ($chamber?->name ?? '—')),
                    $chamber?->share_model ?? 'full',
                    (int) $r->visits,
                    (int) $r->completed,
                    $revenue,
                    $doctorShare,
                    $hospitalShare,
                );
                $totalRevenue  += $revenue;
                $totalDoctor   += $doctorShare;
                $totalHospital += $hospitalShare;
            }
            $csv .= sprintf("TOTAL,,,,,%.2f,%.2f,%.2f\n", $totalRevenue, $totalDoctor, $totalHospital);

            $path = "statements/{$dateStr}/{$hospital->slug}.csv";
            Storage::disk('local')->put($path, $csv);
            $written++;
        }

        $this->info("Wrote {$written} statement(s) for {$dateStr}.");
        return self::SUCCESS;
    }
}
