<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('medixpro:send-followup-reminders --days=1')
    ->dailyAt('08:00')
    ->timezone('Asia/Dhaka')
    ->onOneServer()
    ->withoutOverlapping();

Schedule::command('medixpro:generate-daily-statements')
    ->dailyAt('00:30')
    ->timezone('Asia/Dhaka')
    ->onOneServer()
    ->withoutOverlapping();

Schedule::command('auth:purge-unverified')
    ->hourly()
    ->onOneServer()
    ->withoutOverlapping();
