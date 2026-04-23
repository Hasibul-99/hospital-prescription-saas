<?php

use App\Http\Controllers\Admin\ComplaintMasterController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HospitalController;
use App\Http\Controllers\Admin\MedicineController;
use App\Http\Controllers\Admin\MedicineRequestController;
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

        Route::get('medicines', [MedicineController::class, 'index'])->name('medicines.index');
        Route::get('medicines/create', [MedicineController::class, 'create'])->name('medicines.create');
        Route::post('medicines', [MedicineController::class, 'store'])->name('medicines.store');
        Route::get('medicines/{medicine}/edit', [MedicineController::class, 'edit'])->name('medicines.edit');
        Route::match(['put', 'patch'], 'medicines/{medicine}', [MedicineController::class, 'update'])->name('medicines.update');
        Route::delete('medicines/{medicine}', [MedicineController::class, 'destroy'])->name('medicines.destroy');
        Route::post('medicines/{medicine}/activate', [MedicineController::class, 'activate'])->name('medicines.activate');
        Route::post('medicines/bulk-import', [MedicineController::class, 'bulkImport'])->name('medicines.bulk-import');

        Route::get('medicine-requests', [MedicineRequestController::class, 'index'])->name('medicine-requests.index');
        Route::post('medicine-requests/{medicine}/approve', [MedicineRequestController::class, 'approve'])->name('medicine-requests.approve');
        Route::delete('medicine-requests/{medicine}', [MedicineRequestController::class, 'reject'])->name('medicine-requests.reject');

        Route::post('complaints/bulk-import', [ComplaintMasterController::class, 'bulkImport'])->name('complaints.bulk-import');
        Route::resource('complaints', ComplaintMasterController::class);
        Route::post('complaints/{complaint}/presets', [ComplaintMasterController::class, 'addPreset'])->name('complaints.presets.store');
        Route::post('complaints/{complaint}/presets/reorder', [ComplaintMasterController::class, 'reorderPresets'])->name('complaints.presets.reorder');
        Route::patch('complaints/presets/{preset}', [ComplaintMasterController::class, 'updatePreset'])->name('complaints.presets.update');
        Route::delete('complaints/presets/{preset}', [ComplaintMasterController::class, 'destroyPreset'])->name('complaints.presets.destroy');
    });
