<?php

use App\Http\Controllers\Api\PatientSearchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'hospital.active'])
    ->prefix('api')
    ->group(function () {
        Route::get('/patients/search', [PatientSearchController::class, 'search'])->name('api.patients.search');
        Route::get('/patients/check-duplicate', [PatientSearchController::class, 'checkDuplicate'])->name('api.patients.check-duplicate');
    });
