<?php

namespace App\Console\Commands;

use App\Jobs\SendFollowUpReminderJob;
use App\Models\Prescription;
use Illuminate\Console\Command;

class SendFollowUpRemindersCommand extends Command
{
    protected $signature = 'medixpro:send-followup-reminders {--days=1 : Days ahead to remind}';

    protected $description = 'Queue follow-up reminder emails for prescriptions whose follow-up date is N days away.';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $target = now()->addDays($days)->toDateString();

        $count = 0;
        Prescription::query()
            ->whereDate('follow_up_date', $target)
            ->whereHas('patient', fn ($q) => $q->whereNotNull('email'))
            ->select(['id'])
            ->chunkById(200, function ($rows) use (&$count) {
                foreach ($rows as $rx) {
                    SendFollowUpReminderJob::dispatch($rx->id);
                    $count++;
                }
            });

        $this->info("Queued {$count} follow-up reminders for {$target}.");
        return self::SUCCESS;
    }
}
