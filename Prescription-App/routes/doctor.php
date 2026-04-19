<?php

use App\Http\Controllers\Doctor\DashboardController;
use App\Http\Controllers\Doctor\PatientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:doctor', 'hospital.active'])
    ->prefix('doctor')
    ->name('doctor.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('patients', PatientController::class);
        Route::get('patients-export', [PatientController::class, 'export'])->name('patients.export');
    });
