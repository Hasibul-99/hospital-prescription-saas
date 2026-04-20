<?php

use App\Http\Controllers\Receptionist\AppointmentController;
use App\Http\Controllers\Receptionist\DashboardController;
use App\Http\Controllers\Receptionist\PatientController;
use App\Http\Controllers\Receptionist\SerialQueueController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:receptionist', 'hospital.active'])
    ->prefix('receptionist')
    ->name('receptionist.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('patients', PatientController::class)->except(['destroy']);

        Route::get('/queue', [SerialQueueController::class, 'index'])->name('queue.index');
        Route::patch('/queue/appointments/{appointment}/status', [SerialQueueController::class, 'updateStatus'])->name('queue.status');

        Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
    });
