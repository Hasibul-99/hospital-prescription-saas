<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HospitalController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:super_admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('hospitals', HospitalController::class);
        Route::post('hospitals/{hospital}/toggle-status', [HospitalController::class, 'toggleStatus'])->name('hospitals.toggle-status');

        Route::resource('users', UserController::class);
    });
