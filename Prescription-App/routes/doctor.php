<?php

use App\Http\Controllers\Doctor\AppointmentController;
use App\Http\Controllers\Doctor\DashboardController;
use App\Http\Controllers\Doctor\FollowUpController;
use App\Http\Controllers\Doctor\PatientController;
use App\Http\Controllers\Doctor\SerialQueueController;
use App\Http\Controllers\Doctor\StatementController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:doctor', 'hospital.active'])
    ->prefix('doctor')
    ->name('doctor.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('patients', PatientController::class);
        Route::get('patients-export', [PatientController::class, 'export'])->name('patients.export');

        // Serial Queue (main working screen)
        Route::get('/queue', [SerialQueueController::class, 'index'])->name('queue.index');
        Route::post('/queue/next', [SerialQueueController::class, 'next'])->name('queue.next');
        Route::post('/queue/break', [SerialQueueController::class, 'toggleBreak'])->name('queue.break');
        Route::patch('/queue/appointments/{appointment}/status', [SerialQueueController::class, 'updateStatus'])->name('queue.status');

        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');

        Route::get('/follow-ups', [FollowUpController::class, 'index'])->name('follow-ups.index');
        Route::get('/statements', [StatementController::class, 'index'])->name('statements.index');
    });
