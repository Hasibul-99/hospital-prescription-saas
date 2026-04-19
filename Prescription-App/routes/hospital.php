<?php

use App\Http\Controllers\Hospital\DashboardController;
use App\Http\Controllers\Hospital\DoctorController;
use App\Http\Controllers\Hospital\ReceptionistController;
use App\Http\Controllers\Hospital\ChamberController;
use App\Http\Controllers\Hospital\HolidayController;
use App\Http\Controllers\Hospital\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:hospital_admin', 'hospital.active'])
    ->prefix('hospital')
    ->name('hospital.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('doctors', DoctorController::class);
        Route::resource('receptionists', ReceptionistController::class);
        Route::resource('chambers', ChamberController::class);
        Route::resource('holidays', HolidayController::class)->except(['show']);

        Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
        Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');
    });
