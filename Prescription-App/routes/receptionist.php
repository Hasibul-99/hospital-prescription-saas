<?php

use App\Http\Controllers\Receptionist\DashboardController;
use App\Http\Controllers\Receptionist\PatientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:receptionist', 'hospital.active'])
    ->prefix('receptionist')
    ->name('receptionist.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('patients', PatientController::class)->except(['destroy']);
    });
