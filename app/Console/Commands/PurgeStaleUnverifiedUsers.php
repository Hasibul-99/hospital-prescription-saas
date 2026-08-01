<?php

namespace App\Console\Commands;

use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Console\Command;

class PurgeStaleUnverifiedUsers extends Command
{
    protected $signature = 'auth:purge-unverified {--hours=24}';

    protected $description = 'Delete unverified users older than N hours (default 24) and any stale OTPs.';

    public function handle(): int
    {
        $cutoff = now()->subHours((int) $this->option('hours'));

        $users = User::whereNull('email_verified_at')
            ->where('created_at', '<', $cutoff)
            ->get();

        foreach ($users as $user) {
            OtpVerification::where('email', $user->email)->delete();
            $user->forceDelete();
        }

        $expiredOtps = OtpVerification::where('expires_at', '<', now())->delete();

        $this->info("Purged {$users->count()} unverified users and {$expiredOtps} expired OTPs.");

        return self::SUCCESS;
    }
}
