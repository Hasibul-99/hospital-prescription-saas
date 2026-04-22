<?php

use App\Http\Controllers\Doctor\AppointmentController;
use App\Http\Controllers\Doctor\DashboardController;
use App\Http\Controllers\Doctor\DoctorMedicineDefaultController;
use App\Http\Controllers\Doctor\FollowUpController;
use App\Http\Controllers\Doctor\MedicineController;
use App\Http\Controllers\Doctor\PatientController;
use App\Http\Controllers\Doctor\PrescriptionController;
use App\Http\Controllers\Doctor\PrescriptionPrintController;
use App\Http\Controllers\Doctor\SerialQueueController;
use App\Http\Controllers\Doctor\StatementController;
use App\Http\Controllers\Doctor\TemplateController;
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

        // Prescription Builder
        Route::get('/prescriptions/create', [PrescriptionController::class, 'create'])->name('prescriptions.create');
        Route::post('/prescriptions', [PrescriptionController::class, 'store'])->name('prescriptions.store');
        Route::get('/prescriptions/{prescription}/edit', [PrescriptionController::class, 'edit'])->name('prescriptions.edit');
        Route::match(['put', 'patch'], '/prescriptions/{prescription}', [PrescriptionController::class, 'update'])->name('prescriptions.update');

        // Print / Preview / PDF
        Route::get('/prescriptions/{prescription}/preview', [PrescriptionPrintController::class, 'preview'])->name('prescriptions.preview');
        Route::get('/prescriptions/{prescription}/pdf', [PrescriptionPrintController::class, 'pdf'])->name('prescriptions.pdf');
        Route::get('/prescriptions/{prescription}/download', [PrescriptionPrintController::class, 'download'])->name('prescriptions.download');
        Route::post('/prescriptions/{prescription}/mark-printed', [PrescriptionPrintController::class, 'markPrinted'])->name('prescriptions.mark-printed');
        Route::post('/prescriptions/bulk-pdf', [PrescriptionPrintController::class, 'bulkPdf'])->name('prescriptions.bulk-pdf');

        // Medicine search, frequent list, missing
        Route::get('/medicines/search', [MedicineController::class, 'searchAction'])->name('medicines.search');
        Route::get('/medicines/frequent', [MedicineController::class, 'frequent'])->name('medicines.frequent');
        Route::post('/medicines/frequent/{medicine}', [MedicineController::class, 'addFrequent'])->name('medicines.frequent.add');
        Route::delete('/medicines/frequent/{medicine}', [MedicineController::class, 'removeFrequent'])->name('medicines.frequent.remove');
        Route::post('/medicines', [MedicineController::class, 'storeMissing'])->name('medicines.store');

        // Doctor per-medicine dose defaults
        Route::get('/medicine-defaults/{medicine}', [DoctorMedicineDefaultController::class, 'show'])->name('medicine-defaults.show');
        Route::post('/medicine-defaults/{medicine}', [DoctorMedicineDefaultController::class, 'store'])->name('medicine-defaults.store');
        Route::delete('/medicine-defaults/{medicine}', [DoctorMedicineDefaultController::class, 'destroy'])->name('medicine-defaults.destroy');

        // Templates
        Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
        Route::get('/templates/create', [TemplateController::class, 'create'])->name('templates.create');
        Route::get('/templates/{template}', [TemplateController::class, 'show'])->name('templates.show');
        Route::get('/templates/{template}/edit', [TemplateController::class, 'edit'])->name('templates.edit');
        Route::post('/templates', [TemplateController::class, 'store'])->name('templates.store');
        Route::match(['put', 'patch'], '/templates/{template}', [TemplateController::class, 'update'])->name('templates.update');
        Route::post('/templates/{template}/duplicate', [TemplateController::class, 'duplicate'])->name('templates.duplicate');
        Route::delete('/templates/{template}', [TemplateController::class, 'destroy'])->name('templates.destroy');
    });
