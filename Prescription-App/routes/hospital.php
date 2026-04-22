<?php

use App\Http\Controllers\Hospital\DashboardController;
use App\Http\Controllers\Hospital\DoctorController;
use App\Http\Controllers\Hospital\PatientController;
use App\Http\Controllers\Hospital\ReceptionistController;
use App\Http\Controllers\Hospital\ChamberController;
use App\Http\Controllers\Hospital\HolidayController;
use App\Http\Controllers\Hospital\SettingsController;
use App\Http\Controllers\Hospital\TemplateAnalyticsController;
use App\Http\Controllers\Hospital\TemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:hospital_admin', 'hospital.active'])
    ->prefix('hospital')
    ->name('hospital.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('doctors', DoctorController::class);
        Route::resource('receptionists', ReceptionistController::class);
        Route::resource('patients', PatientController::class);
        Route::get('patients-export', [PatientController::class, 'export'])->name('patients.export');
        Route::resource('chambers', ChamberController::class);
        Route::resource('holidays', HolidayController::class)->except(['show']);

        Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
        Route::put('/settings', [SettingsController::class, 'update'])->name('settings.update');

        Route::get('/templates/analytics', [TemplateAnalyticsController::class, 'index'])->name('templates.analytics');

        Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
        Route::get('/templates/create', [TemplateController::class, 'create'])->name('templates.create');
        Route::get('/templates/{template}/edit', [TemplateController::class, 'edit'])->name('templates.edit');
        Route::post('/templates', [TemplateController::class, 'store'])->name('templates.store');
        Route::match(['put', 'patch'], '/templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
        Route::delete('/templates/{template}', [TemplateController::class, 'destroy'])->name('templates.destroy');
    });
